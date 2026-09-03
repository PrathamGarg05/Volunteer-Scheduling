import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import { searchShiftsHandler } from "../controllers/shiftSearch.controller.js";

const router = express.Router();
router.get("/", requireAuth, searchShiftsHandler);
export default router;