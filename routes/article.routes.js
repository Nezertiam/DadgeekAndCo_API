import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";
import { createArticle, readArticle } from "../controllers/article.controller.js";

const router = express.Router();

// @route   POST api/article/new
// @desc    Create an new article
// @access  Private
router.post("/new", auth, [
    check("title", "Title is required.").not().isEmpty(),
    check("blocks", "Article content cannot be empty.").not().isEmpty()
], createArticle);

// @route   GET api/article/:slug
// @desc    Read an article based on slug
// @access  Public
router.get("/:slug", readArticle);

export default router;