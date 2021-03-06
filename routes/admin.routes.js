import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";

import { banUser } from "../controllers/admin.controller.js";


const router = express.Router();


// @route   get api/admin/ban/:id/:minutes
// @desc    Ban a user
// @access  Private
router.get("/ban/:id/:minutes", auth, banUser);


export default router;