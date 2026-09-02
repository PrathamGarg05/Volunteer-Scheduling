import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import { getShiftTimeline, addShiftNote } from "../controllers/shiftEvent.controller.js";

const router = express.Router({ mergeParams: true });

router.get("/", requireAuth, getShiftTimeline);
router.post("/notes", requireAuth, requireRole("coordinator"), addShiftNote);

export default router;