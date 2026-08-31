import express from 'express';
import requireAuth from "../middleware/auth.middleware.js";
import requireRole from "../middleware/role.middleware.js";
import {
  addMember,
  removeMember,
  getProgramMembers,
} from "../controllers/programMember.controller.js";

const router = express.Router({ mergeParams: true }); // needed to access :id from the parent route

router.post("/", requireAuth, requireRole("coordinator"), addMember);
router.delete("/:volunteerId", requireAuth, requireRole("coordinator"), removeMember);
router.get("/", requireAuth, requireRole("coordinator"), getProgramMembers);

export default router;