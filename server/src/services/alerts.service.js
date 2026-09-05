import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import ShiftEvent from "../models/ShiftEvent.js";
import AlertDismissal from "../models/AlertDismissal.js";

function getThreeDayWindow() {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const threeDaysEnd = new Date(todayStart);
  threeDaysEnd.setDate(threeDaysEnd.getDate() + 3);
  threeDaysEnd.setHours(23, 59, 59, 999);
  return { todayStart, threeDaysEnd };
}

export async function getUnderstaffedShifts(programIds) {
  const { todayStart, threeDaysEnd } = getThreeDayWindow();

  const filter = {
    date: { $gte: todayStart, $lte: threeDaysEnd },
    status: { $in: ["Open", "Partially Filled"] },
  };
  if (programIds) {
    filter.program = { $in: programIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const shifts = await Shift.find(filter).populate("program", "name").sort({ date: 1 });
  if (shifts.length === 0) return [];

  const shiftIds = shifts.map((s) => s._id);

  // One query: every state_change + created event for all these shifts at once,
  // newest first — lets us find each shift's "current state started at" moment
  // by picking the first matching event per shift, in memory, instead of a
  // separate query per shift.
  const allEvents = await ShiftEvent.find({
    shift: { $in: shiftIds },
    type: { $in: ["state_change", "created"] },
  }).sort({ createdAt: -1 });

  // One query: every dismissal for these shifts at once.
  const allDismissals = await AlertDismissal.find({ shift: { $in: shiftIds } });

  // Build lookup maps once, so matching each shift is O(1) instead of another query.
  const eventsByShift = new Map();
  for (const event of allEvents) {
    const key = event.shift.toString();
    if (!eventsByShift.has(key)) eventsByShift.set(key, []);
    eventsByShift.get(key).push(event);
  }

  const dismissalsByShift = new Map();
  for (const dismissal of allDismissals) {
    const key = dismissal.shift.toString();
    if (!dismissalsByShift.has(key)) dismissalsByShift.set(key, []);
    dismissalsByShift.get(key).push(dismissal);
  }

  const results = shifts.map((shift) => {
    const key = shift._id.toString();
    const events = eventsByShift.get(key) || [];

    // events are sorted newest-first; find the most recent one whose newState
    // matches this shift's current status (or fall back to its "created" event).
    const matchingChange = events.find((e) => e.type === "state_change" && e.newState === shift.status);
    const createdEvent = events.find((e) => e.type === "created");
    const stateEnteredAt = matchingChange ? matchingChange.createdAt : (createdEvent ? createdEvent.createdAt : shift.createdAt);

    const dismissals = dismissalsByShift.get(key) || [];
    const isDismissed = dismissals.some((d) => d.stateEnteredAt.getTime() === stateEnteredAt.getTime());

    return {
      shiftId: shift._id,
      programName: shift.program.name,
      date: shift.date,
      startTime: shift.startTime,
      status: shift.status,
      dismissed: isDismissed,
    };
  });

  return results;
}

export async function dismissAlert(shiftId, userId) {
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new Error("Shift not found.");

  const events = await ShiftEvent.find({
    shift: shiftId, type: { $in: ["state_change", "created"] },
  }).sort({ createdAt: -1 });

  const matchingChange = events.find((e) => e.type === "state_change" && e.newState === shift.status);
  const createdEvent = events.find((e) => e.type === "created");
  const stateEnteredAt = matchingChange ? matchingChange.createdAt : (createdEvent ? createdEvent.createdAt : shift.createdAt);

  const existing = await AlertDismissal.findOne({ shift: shiftId, stateEnteredAt });
  if (existing) return existing;

  return AlertDismissal.create({ shift: shiftId, stateEnteredAt, dismissedBy: userId });
}