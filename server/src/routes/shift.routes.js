import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
  createShift,
  getShiftsByProgram,
  getShiftById,
  updateShift,
  deleteShift,
} from "../controllers/shift.controller.js";

const router = express.Router({ mergeParams: true });

router.post("/", requireAuth, requireRole("coordinator"), createShift);
router.get("/", requireAuth, getShiftsByProgram);
router.get("/:shiftId", requireAuth, getShiftById);
router.put("/:shiftId", requireAuth, requireRole("coordinator"), updateShift);
router.delete("/:shiftId", requireAuth, requireRole("coordinator"), deleteShift);

export default router;