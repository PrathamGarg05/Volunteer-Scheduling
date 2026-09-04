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

// Finds when a shift's CURRENT status began — i.e. the timestamp of the most
// recent event that set it to what it currently is. This is what an
// AlertDismissal is actually scoped against, not the shift itself.
async function getCurrentStateEnteredAt(shift) {
  const lastMatchingChange = await ShiftEvent.findOne({
    shift: shift._id,
    type: "state_change",
    newState: shift.status,
  }).sort({ createdAt: -1 });

  if (lastMatchingChange) return lastMatchingChange.createdAt;

  // never changed since creation — the "created" event is when this status began
  const createdEvent = await ShiftEvent.findOne({ shift: shift._id, type: "created" });
  return createdEvent ? createdEvent.createdAt : shift.createdAt;
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

  const results = [];
  for (const shift of shifts) {
    const stateEnteredAt = await getCurrentStateEnteredAt(shift);

    const dismissal = await AlertDismissal.findOne({
      shift: shift._id,
      stateEnteredAt,
    });

    results.push({
      shiftId: shift._id,
      programName: shift.program.name,
      date: shift.date,
      startTime: shift.startTime,
      status: shift.status,
      dismissed: !!dismissal,
    });
  }

  return results;
}

export async function dismissAlert(shiftId, userId) {
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new Error("Shift not found.");

  const stateEnteredAt = await getCurrentStateEnteredAt(shift);

  const existing = await AlertDismissal.findOne({ shift: shiftId, stateEnteredAt });
  if (existing) return existing; // already dismissed for this episode, no-op

  return AlertDismissal.create({ shift: shiftId, stateEnteredAt, dismissedBy: userId });
}