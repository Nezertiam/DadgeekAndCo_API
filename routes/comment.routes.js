import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";
import { createComment } from "../controllers/comment.controller.js";

const router = express.Router();

// @Route   POST api/comment
// @Desc    Create a new comment relative to one article
// @access  Private
router.post("/", auth, [
    check("slug", "Article slug is required.").not().isEmpty(),
    check("text", "Comment content cannot be empty.").not().isEmpty()
], createComment)

export default router;