const router = require("express").Router();
const SecurityController = require("../controllers/security.controller.js");
const { check } = require("express-validator");

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post("/register", [
    check("name", "Name is required.").not().isEmpty(),
    check("email", "Please include a valid email.").isEmail(),
    check("password", "Please enter a password with 8 or more characters.").isLength({ min: 8 })
], SecurityController.register);

// @route   POST api/user
// @desc    Authenticate user & get token
// @access  Public
router.post("/auth", [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], SecurityController.authentication);

module.exports = router;