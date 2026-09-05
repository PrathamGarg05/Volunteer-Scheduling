import Shift from "../models/Shift.js";
import Program from "../models/Program.js";
import ProgramMember from "../models/ProgramMember.js";
import ShiftEvent from "../models/ShiftEvent.js";
import { deriveFillState } from "../services/fillState.service.js";
import Signup from "../models/Signup.js";

export const createShift = async (req, res) => {
  try {
    const { id: programId } = req.params;
    const { date, startTime, durationMinutes, location, requiredHeadcount } = req.body;

    if (!date || !startTime || !durationMinutes || !location || !requiredHeadcount) {
      return res.status(400).json({
        message: "date, startTime, durationMinutes, location, and requiredHeadcount are all required.",
      });
    }
    if (requiredHeadcount < 1) {
      return res.status(400).json({ message: "requiredHeadcount must be at least 1." });
    }

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    const shift = await Shift.create({
      program: programId,
      date,
      startTime,
      durationMinutes,
      location,
      requiredHeadcount,
      // status intentionally omitted — schema default is "Open", and it must
      // only ever be changed by the fill-state derivation logic (Goal 4),
      // never set directly here.
    });

    await ShiftEvent.create({ shift: shift._id, type: "created", actor: req.user.id });

    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: "Failed to create shift.", error: err.message });
  }
};

// "Opening a program shows its shifts" — Goal 3.
export const getShiftsByProgram = async (req, res) => {
  try {
    const { id: programId } = req.params;

    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found." });
    }

    if (req.user.role === "volunteer") {
      const membership = await ProgramMember.findOne({
        program: programId,
        volunteer: req.user.id,
      });
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this program." });
      }
    }

    const shifts = await Shift.find({ program: programId }).sort({ date: 1, startTime: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch shifts.", error: err.message });
  }
};

export const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.shiftId);
    if (!shift) {
      return res.status(404).json({ message: "Shift not found." });
    }

    if (req.user.role === "volunteer") {
      const membership = await ProgramMember.findOne({
        program: shift.program,
        volunteer: req.user.id,
      });
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this program." });
      }
    }

    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch shift.", error: err.message });
  }
};

export const updateShift = async (req, res) => {
  try {
    const { date, startTime, durationMinutes, location, requiredHeadcount } = req.body;
    const shift = await Shift.findById(req.params.shiftId);
    if (!shift) {
      return res.status(404).json({ message: "Shift not found." });
    }

    if (shift.status === "Closed") {
      return res.status(400).json({ message: "Cannot edit a closed shift." });
    }

    if (date !== undefined) shift.date = date;
    if (startTime !== undefined) shift.startTime = startTime;
    if (durationMinutes !== undefined) shift.durationMinutes = durationMinutes;
    if (location !== undefined) shift.location = location;

    if (requiredHeadcount !== undefined) {
      shift.requiredHeadcount = requiredHeadcount;
      const activeCount = await Signup.countDocuments({ shift: shift._id, status: "active" });
      const newStatus = deriveFillState(activeCount, requiredHeadcount);
      if (newStatus !== shift.status) {
        const oldStatus = shift.status;
        shift.status = newStatus;
        await shift.save();
        await ShiftEvent.create({
          shift: shift._id, type: "state_change", oldState: oldStatus, newState: newStatus, actor: req.user.id,
        });
        return res.json(shift);
      }
    }

    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: "Failed to update shift.", error: err.message });
  }
};

export const deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.shiftId);
    if (!shift) return res.status(404).json({ message: "Shift not found." });

    const activeSignups = await Signup.countDocuments({ shift: shift._id, status: "active" });
    if (activeSignups > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${activeSignups} volunteer(s) currently signed up. Close the shift instead, or cancel their signups first.`,
      });
    }

    await Shift.findByIdAndDelete(req.params.shiftId);
    res.json({ message: "Shift deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete shift.", error: err.message });
  }
};

export const closeShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.shiftId);
    if (!shift) return res.status(404).json({ message: "Shift not found." });
    if (shift.status === "Closed") {
      return res.status(400).json({ message: "Shift is already closed." });
    }

    const oldStatus = shift.status;
    shift.status = "Closed";
    await shift.save();

    await ShiftEvent.create({
      shift: shift._id,
      type: "state_change",
      oldState: oldStatus,
      newState: "Closed",
      actor: req.user.id,
    });

    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: "Failed to close shift.", error: err.message });
  }
};
