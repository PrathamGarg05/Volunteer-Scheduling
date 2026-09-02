import ShiftEvent from "../models/ShiftEvent.js";
import Shift from "../models/Shift.js";
import ProgramMember from "../models/ProgramMember.js";

export const getShiftTimeline = async (req, res) => {
    try {
      const { shiftId } = req.params;
  
      const shift = await Shift.findById(shiftId);
      if (!shift) return res.status(404).json({ message: "Shift not found." });
  
      if (req.user.role === "volunteer") {
        const membership = await ProgramMember.findOne({ program: shift.program, volunteer: req.user.id });
        if (!membership) {
          return res.status(403).json({ message: "You are not a member of this program." });
        }
      }
  
      const events = await ShiftEvent.find({ shift: shiftId })
        .sort({ createdAt: 1 }) // oldest first — a timeline reads chronologically
        .populate("actor", "name role");
  
      res.json(events);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch timeline.", error: err.message });
    }
};

// Coordinator-only: append a note to a shift's history.
// This is an INSERT only — there is deliberately no update or delete
// exposed anywhere for ShiftEvent (Goal 9: nothing can be edited or deleted).

export const addShiftNote = async (req, res) => {
    try {
      const { shiftId } = req.params;
      const { message } = req.body;
  
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Note message is required." });
      }
  
      const shift = await Shift.findById(shiftId);
      if (!shift) return res.status(404).json({ message: "Shift not found." });
  
      const event = await ShiftEvent.create({
        shift: shiftId,
        type: "note",
        actor: req.user.id,
        message: message.trim(),
      });
  
      res.status(201).json(event);
    } catch (err) {
      res.status(500).json({ message: "Failed to add note.", error: err.message });
    }
};
  