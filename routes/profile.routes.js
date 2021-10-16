const router = require("express").Router();
const ProfileController = require("../controllers/profile.controller.js");
const auth = require("../middleware/auth");

// @route   GET api/profile/me
// @desc    Get user's profile
// @access  Private
router.get("/me", auth, ProfileController.getMyProfile);

module.exports = router;