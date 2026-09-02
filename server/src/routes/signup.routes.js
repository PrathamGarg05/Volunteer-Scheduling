import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import { createSignup, cancelSignup } from "../controllers/signup.controller.js";

const router = express.Router({ mergeParams: true });

router.post("/", requireAuth, createSignup);
router.patch("/:signupId/cancel", requireAuth, cancelSignup);

export default router;