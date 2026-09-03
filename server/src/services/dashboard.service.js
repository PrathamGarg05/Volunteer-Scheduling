import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import Signup from "../models/Signup.js";
import ShiftEvent from "../models/ShiftEvent.js";
import Program from "../models/Program.js";

// Calendar week: Monday 00:00 to the following Monday 00:00.
function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return { weekStart, weekEnd };
}

function scopeFilter(programIds) {
  return programIds ? { program: { $in: programIds.map((id) => new mongoose.Types.ObjectId(id)) } } : {};
}

export async function getHeadlineNumbers(programIds) {
  const { weekStart, weekEnd } = getWeekBounds();
  const scope = scopeFilter(programIds);

  const shiftsThisWeek = await Shift.countDocuments({
    ...scope, date: { $gte: weekStart, $lt: weekEnd },
  });

  const openShiftsThisWeek = await Shift.countDocuments({
    ...scope, date: { $gte: weekStart, $lt: weekEnd }, status: { $in: ["Open", "Partially Filled"] },
  });

  const signupsThisWeek = await Signup.aggregate([
    { $lookup: { from: "shifts", localField: "shift", foreignField: "_id", as: "shiftInfo" } },
    { $unwind: "$shiftInfo" },
    { $match: { "shiftInfo.date": { $exists: true }, createdAt: { $gte: weekStart, $lt: weekEnd },
        ...(programIds ? { "shiftInfo.program": { $in: programIds.map((id) => new mongoose.Types.ObjectId(id)) } } : {}) } },
    { $count: "count" },
  ]);

  const shiftsClosedThisWeek = await ShiftEvent.aggregate([
    { $match: { type: "state_change", newState: "Closed", createdAt: { $gte: weekStart, $lt: weekEnd } } },
    { $lookup: { from: "shifts", localField: "shift", foreignField: "_id", as: "shiftInfo" } },
    { $unwind: "$shiftInfo" },
    ...(programIds ? [{ $match: { "shiftInfo.program": { $in: programIds.map((id) => new mongoose.Types.ObjectId(id)) } } }] : []),
    { $count: "count" },
  ]);

  return {
    shiftsThisWeek,
    openShiftsThisWeek,
    signupsThisWeek: signupsThisWeek[0]?.count || 0,
    shiftsClosedThisWeek: shiftsClosedThisWeek[0]?.count || 0,
  };
}

export async function getBreakdownByState(programIds) {
  const scope = scopeFilter(programIds);
  const results = await Shift.aggregate([
    { $match: scope },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  // ensure every state appears even at 0, so the frontend doesn't need to guess
  const base = { Open: 0, "Partially Filled": 0, Filled: 0, Closed: 0 };
  results.forEach((r) => { base[r._id] = r.count; });
  return base;
}

export async function getBreakdownByProgram(programIds) {
  const scope = scopeFilter(programIds);
  const results = await Shift.aggregate([
    { $match: scope },
    { $group: { _id: "$program", count: { $sum: 1 } } },
    { $lookup: { from: "programs", localField: "_id", foreignField: "_id", as: "programInfo" } },
    { $unwind: "$programInfo" },
    { $project: { _id: 0, programId: "$_id", programName: "$programInfo.name", count: 1 } },
    { $sort: { count: -1 } },
  ]);
  return results;
}

export async function getWeeklySignupTrend(programIds) {
  const { weekStart: currentWeekStart } = getWeekBounds();
  const eightWeeksAgo = new Date(currentWeekStart);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7); // 7 prior weeks + current = 8

  const matchStage = { createdAt: { $gte: eightWeeksAgo } };

  const pipeline = [
    { $lookup: { from: "shifts", localField: "shift", foreignField: "_id", as: "shiftInfo" } },
    { $unwind: "$shiftInfo" },
    { $match: programIds
        ? { ...matchStage, "shiftInfo.program": { $in: programIds.map((id) => new mongoose.Types.ObjectId(id)) } }
        : matchStage },
    { $group: {
        _id: { $dateTrunc: { date: "$createdAt", unit: "week", startOfWeek: "monday" } },
        count: { $sum: 1 },
      } },
    { $sort: { _id: 1 } },
  ];

  const results = await Signup.aggregate(pipeline);

  // fill in weeks with zero signups so the chart has all 8 points, not just the ones with data
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const match = results.find((r) => r._id.getTime() === weekStart.getTime());
    weeks.push({ weekStart: weekStart.toISOString().slice(0, 10), count: match?.count || 0 });
  }
  return weeks;
}