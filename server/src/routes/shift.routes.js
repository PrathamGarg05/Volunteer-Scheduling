import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
  createShift,
  getShiftsByProgram,
  getShiftById,
  updateShift,
  deleteShift,
  closeShift
} from "../controllers/shift.controller.js";
import { createRecurringShifts } from "../controllers/recurring.controller.js";

const router = express.Router({ mergeParams: true });

router.post("/", requireAuth, requireRole("coordinator"), createShift);
router.get("/", requireAuth, getShiftsByProgram);
router.get("/:shiftId", requireAuth, getShiftById);
router.put("/:shiftId", requireAuth, requireRole("coordinator"), updateShift);
router.delete("/:shiftId", requireAuth, requireRole("coordinator"), deleteShift);
router.patch("/:shiftId/close", requireAuth, requireRole("coordinator"), closeShift);
router.post("/recurring", requireAuth, requireRole("coordinator"), createRecurringShifts);

export default router;