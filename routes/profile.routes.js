import express from "express";
import { getMyProfile } from "../controllers/profile.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// @route   GET api/profile/me
// @desc    Get user's profile
// @access  Private
router.get("/me", auth, getMyProfile);

export default router;