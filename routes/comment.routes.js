import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";
import { createComment, readComment, editComment } from "../controllers/comment.controller.js";

const router = express.Router();

// @Route   POST api/comment
// @Desc    Create a new comment relative to one article
// @access  Private
router.post("/", auth, [
    check("slug", "Article slug is required.").not().isEmpty(),
    check("text", "Comment content cannot be empty.").not().isEmpty()
], createComment);

// @Route   GET api/comment/:id
// @Desc    Read a specific comment
// @access  Public
router.get("/:id", readComment);

// @Route   PUT api/comment/:id
// @Desc    Edit a specific comment
// @access  Private
router.put("/:id", auth, editComment);

export default router;