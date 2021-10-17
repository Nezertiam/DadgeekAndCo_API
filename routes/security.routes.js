import express from "express";
import { register, authentication, deleteMe } from "../controllers/security.controller.js";
import { check } from "express-validator";
import auth from "../middleware/auth.js"

const router = express.Router();

// @route   POST api/security/register
// @desc    Register user
// @access  Public
router.post("/register", [
    check("name", "Name is required.").not().isEmpty(),
    check("email", "Please include a valid email.").isEmail(),
    check("password", "Please enter a password with 8 or more characters.").isLength({ min: 8 })
], register);

// @route   POST api/security/auth
// @desc    Authenticate user & get token
// @access  Public
router.post("/auth", [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], authentication);

// @route   GET api/security/delete
// @desc    "Delete" user's account and profile by overwriting personal data by other strings
// @access  private
router.get("/delete", auth, deleteMe);


export default router;