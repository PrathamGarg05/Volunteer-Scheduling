import Signup from "../models/Signup.js";
import Shift from "../models/Shift.js";
import ProgramMember from "../models/ProgramMember.js";
import ShiftEvent from "../models/ShiftEvent.js";
import { deriveFillState } from "../services/fillState.service.js";
import { hasOverlappingSignups } from "../services/overlap.service.js";

// Recomputes and persists a shift's status after any signup/cancel,
// logging a state_change event only if the status actually changed.
// Never overrides "Closed" — Closed is a manual, one-way transition.
async function recomputeShiftStatus(shift, actorId) {
  const activeCount = await Signup.countDocuments({ shift: shift._id, status: "active" });
  const newStatus = shift.status === "Closed"
    ? "Closed"
    : deriveFillState(activeCount, shift.requiredHeadcount);

  if (newStatus !== shift.status) {
    const oldStatus = shift.status;
    shift.status = newStatus;
    await shift.save();
    await ShiftEvent.create({
      shift: shift._id,
      type: "state_change",
      oldState: oldStatus,
      newState: newStatus,
      actor: actorId,
    });
  }
  return shift;
}

export const createSignup = async (req, res) => {
  try {
    const { shiftId } = req.params;
    // volunteer signs themself up; a coordinator signs up on someone's behalf via volunteerId
    const targetVolunteerId = req.user.role === "coordinator" ? req.body.volunteerId : req.user.id;
    if (!targetVolunteerId) {
      return res.status(400).json({ message: "volunteerId is required when a coordinator signs someone up." });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) return res.status(404).json({ message: "Shift not found." });

    if (shift.status === "Filled" || shift.status === "Closed") {
      return res.status(400).json({ message: `Cannot sign up: shift is ${shift.status}.` });
    }

    const membership = await ProgramMember.findOne({ program: shift.program, volunteer: targetVolunteerId });
    if (!membership) {
      return res.status(403).json({ message: "Volunteer must be a member of this program to sign up." });
    }

    const existing = await Signup.findOne({ shift: shiftId, volunteer: targetVolunteerId, status: "active" });
    if (existing) {
      return res.status(409).json({ message: "This volunteer already has an active signup for this shift." });
    }

    const overlap = await hasOverlappingSignups(targetVolunteerId, shift);
    if (overlap) {
      return res.status(400).json({ message: "This signup overlaps another shift the volunteer is already signed up for." });
    }

    const signup = await Signup.create({
      shift: shiftId,
      volunteer: targetVolunteerId,
      createdBy: req.user.id,
      status: "active",
    });

    await ShiftEvent.create({
      shift: shiftId,
      type: "signup",
      actor: req.user.id,
      message: `Signed up volunteer ${targetVolunteerId}`,
    });

    await recomputeShiftStatus(shift, req.user.id);

    res.status(201).json(signup);
  } catch (err) {
    res.status(500).json({ message: "Failed to create signup.", error: err.message });
  }
};

export const cancelSignup = async (req, res) => {
  try {
    const { signupId } = req.params;
    const signup = await Signup.findById(signupId);
    if (!signup) return res.status(404).json({ message: "Signup not found." });
    if (signup.status === "cancelled") {
      return res.status(400).json({ message: "Signup is already cancelled." });
    }

    if (req.user.role === "volunteer" && !signup.volunteer.equals(req.user.id)) {
      return res.status(403).json({ message: "You can only cancel your own signups." });
    }

    const shift = await Shift.findById(signup.shift);
    if (!shift) return res.status(404).json({ message: "Associated shift not found." });
    if (shift.status === "Closed") {
      return res.status(400).json({ message: "Cannot cancel a signup on a closed shift." });
    }

    signup.status = "cancelled";
    signup.cancelledAt = new Date();
    await signup.save();

    await ShiftEvent.create({
      shift: shift._id,
      type: "cancel",
      actor: req.user.id,
      message: `Cancelled signup for volunteer ${signup.volunteer}`,
    });

    await recomputeShiftStatus(shift, req.user.id);

    res.json(signup);
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel signup.", error: err.message });
  }
};