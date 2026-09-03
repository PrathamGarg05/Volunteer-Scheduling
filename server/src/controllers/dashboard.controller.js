import ProgramMember from "../models/ProgramMember.js";
import {
  getHeadlineNumbers,
  getBreakdownByState,
  getBreakdownByProgram,
  getWeeklySignupTrend,
} from "../services/dashboard.service.js";

export const getDashboard = async (req, res) => {
  try {
    let programIds = null;
    if (req.user.role === "volunteer") {
      const memberships = await ProgramMember.find({ volunteer: req.user.id }).select("program");
      programIds = memberships.map((m) => m.program.toString());
    }

    const [headline, byState, byProgram, weeklyTrend] = await Promise.all([
      getHeadlineNumbers(programIds),
      getBreakdownByState(programIds),
      getBreakdownByProgram(programIds),
      getWeeklySignupTrend(programIds),
    ]);

    res.json({ headline, byState, byProgram, weeklyTrend });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard.", error: err.message });
  }
};