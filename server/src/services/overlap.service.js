import Signup from "../models/Signup.js";

// Combines a shift's date + "HH:mm" startTime into a real Date, per Decision 5.
function getShiftWindow(shift) {
    const start = new Date(shift.date);
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    start.setHours(hours, minutes,0,0);
    const end = new Date(start.getTime() + shift.durationMinutes * 60000);
    return {start, end};
}

/**
 * Checks whether targetShift's time window overlaps ANY of this volunteer's
 * other active signups — across every program, not just this shift's program.
*/

export async function hasOverlappingSignups(volunteerId, targetShift) {
    const targetWindow = getShiftWindow(targetShift);

    const activeSignups = await Signup.find({ volunteer: volunteerId, status: "active" })
    .populate("shift");

    for(const signup of activeSignups) {
        if (!signup.shift) continue; // shift may have been deleted
        if (signup.shift._id.equals(targetShift._id)) continue; // ignore self

        const otherWindow = getShiftWindow(signup.shift);
        const overlaps = targetWindow.start < otherWindow.end && otherWindow.start < targetWindow.end;
        if (overlaps) return true;
    }
    return false;
}