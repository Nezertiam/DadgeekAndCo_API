import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";
import { createArticle, readArticle, editArticle } from "../controllers/article.controller.js";

const router = express.Router();

// @route   POST api/article
// @desc    Create an new article
// @access  Private
router.post("/", auth, [
    check("title", "Title is required.").not().isEmpty(),
    check("blocks", "Article content cannot be empty.").not().isEmpty()
], createArticle);

// @route   GET api/article/:slug
// @desc    Read an article based on slug
// @access  Public
router.get("/:slug", readArticle);

// @route   PUT api/article/:slug
// @desc    Edit an article based on slug
// @access  Private
router.put("/:slug", auth, editArticle);

export default router;

