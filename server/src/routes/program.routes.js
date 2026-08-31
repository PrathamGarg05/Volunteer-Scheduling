import express from 'express';
import requireAuth from "../middleware/auth.middleware.js"
import requireRole from "../middleware/role.middleware.js"
import {
    createProgram,
    getPrograms,
    getProgramById,
    updateProgram,
    archiveProgram,
    restoreProgram,
} from "../controllers/program.controller.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("coordinator"), createProgram);
router.get("/", requireAuth, getPrograms);
router.get("/:id", requireAuth, getProgramById);
router.put("/:id", requireAuth, requireRole("coordinator"), updateProgram);
router.patch("/:id/archive", requireAuth, requireRole("coordinator"), archiveProgram);
router.patch("/:id/restore", requireAuth, requireRole("coordinator"), restoreProgram);

export default router;