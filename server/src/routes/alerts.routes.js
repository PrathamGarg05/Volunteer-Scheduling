import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import { getAlerts, dismissAlertHandler } from "../controllers/alerts.controller.js";

const router = express.Router();

router.get("/", requireAuth, getAlerts);
router.post("/:shiftId/dismiss", requireAuth, requireRole("coordinator"), dismissAlertHandler);

export default router;