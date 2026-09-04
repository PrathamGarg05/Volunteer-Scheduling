import ProgramMember from "../models/ProgramMember.js";
import { getUnderstaffedShifts, dismissAlert } from "../services/alerts.service.js";

export const getAlerts = async (req, res) => {
  try {
    let programIds = null;
    if (req.user.role === "volunteer") {
      const memberships = await ProgramMember.find({ volunteer: req.user.id }).select("program");
      programIds = memberships.map((m) => m.program.toString());
    }

    const alerts = await getUnderstaffedShifts(programIds);
    const activeCount = alerts.filter((a) => !a.dismissed).length;

    res.json({ alerts, activeCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to load alerts.", error: err.message });
  }
};

export const dismissAlertHandler = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const dismissal = await dismissAlert(shiftId, req.user.id);
    res.status(201).json(dismissal);
  } catch (err) {
    res.status(500).json({ message: "Failed to dismiss alert.", error: err.message });
  }
};