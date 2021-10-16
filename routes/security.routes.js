import express from "express";
import { register, authentication } from "../controllers/security.controller.js";
import { check } from "express-validator";

const router = express.Router();

// @route   POST api/security
// @desc    Register user
// @access  Public
router.post("/register", [
    check("name", "Name is required.").not().isEmpty(),
    check("email", "Please include a valid email.").isEmail(),
    check("password", "Please enter a password with 8 or more characters.").isLength({ min: 8 })
], register);

// @route   POST api/security
// @desc    Authenticate user & get token
// @access  Public
router.post("/auth", [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], authentication);


export default router;