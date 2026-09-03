import mongoose from "mongoose";
import Shift from "../models/Shift.js";

const STATUS_RANK = { "Open": 0, "Partially Filled": 1, "Filled": 2, "Closed": 3 };

export async function searchShifts({
  programIds,       // null = no restriction (coordinator); array = restrict to these (volunteer)
  includeArchived = false,
  search,
  program,
  status,
  dateFrom,
  dateTo,
  sortBy = "date",
  sortOrder = "asc",
  page = 1,
  limit = 10,
}) {
  const pipeline = [];

  // join Program so we can search/filter by program name and archived status
  pipeline.push({
    $lookup: { from: "programs", localField: "program", foreignField: "_id", as: "programInfo" },
  });
  pipeline.push({ $unwind: "$programInfo" });

  const match = {};
  if (programIds) {
    match.program = { $in: programIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }
  if (!includeArchived) {
    match["programInfo.isArchived"] = false;
  }
  if (program) {
    match.program = new mongoose.Types.ObjectId(program);
  }
  if (status) {
    match.status = status;
  }
  if (dateFrom || dateTo) {
    match.date = {};
    if (dateFrom) match.date.$gte = new Date(dateFrom);
    if (dateTo) match.date.$lte = new Date(dateTo);
  }
  if (search) {
    // case-insensitive partial match across program name + location.
    // Regex rather than a $text index here since $text can't combine across
    // a $lookup-ed field cleanly — acceptable at this scale; schema.md already
    // flags proper text-indexing as a 100x-data concern.
    const re = new RegExp(search, "i");
    match.$or = [{ "programInfo.name": re }, { location: re }];
  }
  pipeline.push({ $match: match });

  // numeric rank so "sort by fill state" has a defined order (Open -> ... -> Closed)
  if (sortBy === "status") {
    pipeline.push({
      $addFields: {
        statusRank: {
          $switch: {
            branches: Object.entries(STATUS_RANK).map(([k, v]) => ({ case: { $eq: ["$status", k] }, then: v })),
            default: 99,
          },
        },
      },
    });
  }

  const sortField = sortBy === "status" ? "statusRank" : sortBy === "startTime" ? "startTime" : "date";
  const sortDir = sortOrder === "desc" ? -1 : 1;
  pipeline.push({ $sort: { [sortField]: sortDir, _id: 1 } }); // _id as a stable tiebreaker

  // $facet runs the paginated data and the total count in a single query pass
  const skip = (Number(page) - 1) * Number(limit);
  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: Number(limit) }],
      totalCount: [{ $count: "count" }],
    },
  });

  const [result] = await Shift.aggregate(pipeline);
  const shifts = result.data;
  const total = result.totalCount[0]?.count || 0;

  return { shifts, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) };
}