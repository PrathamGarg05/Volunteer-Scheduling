import ProgramMember from "../models/ProgramMember.js";
import { searchShifts } from "../services/shiftSearch.service.js";

export const searchShiftsHandler = async (req, res) => {
  try {
    const { search, program, status, dateFrom, dateTo, sortBy, sortOrder, page, limit, includeArchived } = req.query;

    let programIds = null; // null = no restriction, for coordinators
    if (req.user.role === "volunteer") {
      const memberships = await ProgramMember.find({ volunteer: req.user.id }).select("program");
      programIds = memberships.map((m) => m.program.toString());
    }

    const result = await searchShifts({
      programIds,
      includeArchived: includeArchived === "true",
      search,
      program,
      status,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page: page || 1,
      limit: limit || 10,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to search shifts.", error: err.message });
  }
};