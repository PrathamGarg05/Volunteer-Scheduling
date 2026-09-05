import Shift from "../models/Shift.js";
import ShiftEvent from "../models/ShiftEvent.js";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Generates shifts for a program from a weekly recurrence pattern over a date range.
 * Pure-ish: takes a pattern + range, returns which dates got created vs skipped and why.
 * Actual DB writes happen here (not pure), but the reporting logic is what needs to be right.
 */
export async function generateRecurringShifts({
  programId,
  dayOfWeek,       // 0-6, Sunday=0, matching JS Date.getDay()
  startTime,
  durationMinutes,
  location,
  requiredHeadcount,
  rangeStart,
  rangeEnd,
  holidays = [],   // array of "YYYY-MM-DD" strings
  actorId
}) {
  const holidaySet = new Set(holidays);
  const created = [];
  const skipped = [];

  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);

  // find the first occurrence of dayOfWeek on or after rangeStart
  let current = new Date(start);
  const offset = (dayOfWeek - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + offset);

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);

    if (holidaySet.has(dateStr)) {
      skipped.push({ date: dateStr, reason: "holiday" });
    } else {
      const existing = await Shift.findOne({
        program: programId,
        date: new Date(dateStr),
        startTime,
      });

      if (existing) {
        skipped.push({ date: dateStr, reason: "shift already exists" });
      } else {
        const shift = await Shift.create({
          program: programId,
          date: new Date(dateStr),
          startTime,
          durationMinutes,
          location,
          requiredHeadcount,
        });
        await ShiftEvent.create({ shift: shift._id, type: "created", actor: actorId });
        created.push({ date: dateStr, shiftId: shift._id });
      }
    }

    current.setDate(current.getDate() + 7); // next week, same day
  }

  return {
    dayOfWeek: DAY_NAMES[dayOfWeek],
    totalCreated: created.length,
    totalSkipped: skipped.length,
    created,
    skipped,
  };
}