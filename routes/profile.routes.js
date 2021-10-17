import express from "express";
import { getMyProfile, editMyProfile } from "../controllers/profile.controller.js";
import auth from "../middleware/auth.js";


const router = express.Router();

// @route   GET api/profile/me
// @desc    Get user's profile
// @access  Private
router.get("/me", auth, getMyProfile);

// @route   GET api/profile/user/:user_id
// @desc    Get user's profile
// @access  Private
router.get("/user/:user_id", auth, getProfile);

// @route   GET api/profile/edit
// @desc    Edit user's profile
// @access  Private
router.put("/edit", auth, editMyProfile);

export default router;