import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = express.Router();
router.get("/", requireAuth, getDashboard);
export default router;