import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import { listVolunteers } from "../controllers/user.controller.js";

const router = express.Router();
router.get("/volunteers", requireAuth, requireRole("coordinator"), listVolunteers);
export default router;