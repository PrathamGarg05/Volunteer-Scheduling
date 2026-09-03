import { Parser } from "json2csv";
import Signup from "../models/Signup.js";
import ProgramMember from "../models/ProgramMember.js";
import Shift from "../models/Shift.js";

export async function generateRosterCsv(programId) {
  const members = await ProgramMember.find({ program: programId }).populate("volunteer", "name email");

  const shiftIds = await Shift.find({ program: programId }).select("_id");
  const shiftIdList = shiftIds.map((s) => s._id);

  const rows = [];
  for (const member of members) {
    const signups = await Signup.find({
      volunteer: member.volunteer._id,
      shift: { $in: shiftIdList },
      status: "active",
    }).populate("shift", "durationMinutes");

    const totalMinutes = signups.reduce((sum, s) => sum + (s.shift?.durationMinutes || 0), 0);

    rows.push({
      name: member.volunteer.name,
      email: member.volunteer.email,
      totalShifts: signups.length,
      totalHours: (totalMinutes / 60).toFixed(2),
    });
  }

  const parser = new Parser({ fields: ["name", "email", "totalShifts", "totalHours"] });
  return parser.parse(rows);
}