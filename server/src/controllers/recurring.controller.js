import Program from "../models/Program.js";
import { generateRecurringShifts } from "../services/recurring.service.js";

export const createRecurringShifts = async (req, res) => {
  try {
    const { id: programId } = req.params;
    const { dayOfWeek, startTime, durationMinutes, location, requiredHeadcount, rangeStart, rangeEnd, holidays } = req.body;

    if (dayOfWeek === undefined || !startTime || !durationMinutes || !location || !requiredHeadcount || !rangeStart || !rangeEnd) {
      return res.status(400).json({ message: "Missing required recurrence fields." });
    }
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: "dayOfWeek must be 0-6 (Sunday-Saturday)." });
    }

    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found." });

    const report = await generateRecurringShifts({
      programId, dayOfWeek, startTime, durationMinutes, location, requiredHeadcount,
      rangeStart, rangeEnd, holidays: holidays || [],actorId: req.user.id,
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate recurring shifts.", error: err.message });
  }
};