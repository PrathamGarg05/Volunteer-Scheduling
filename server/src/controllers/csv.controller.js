import Program from "../models/Program.js";
import { generateRosterCsv } from "../services/csv.service.js";

export const exportRoster = async (req, res) => {
  try {
    const { id: programId } = req.params;
    const program = await Program.findById(programId);
    if (!program) return res.status(404).json({ message: "Program not found." });

    const csv = await generateRosterCsv(programId);

    res.header("Content-Type", "text/csv");
    res.attachment(`roster-${program.name.replace(/\s+/g, "-")}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Failed to export roster.", error: err.message });
  }
};