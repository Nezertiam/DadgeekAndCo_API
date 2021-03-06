import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";
import { createArticle, readArticle, readArticles, editArticle, deleteArticle, likeArticle } from "../controllers/article.controller.js";

const router = express.Router();

// @route   POST api/article
// @desc    Create an new article
// @access  Private
router.post("/", auth, [
    check("title", "Title is required.").not().isEmpty(),
    check("content", "Article content cannot be empty.").not().isEmpty()
], createArticle);

// @route   GET api/article
// @desc    Read all article based on pagination
// @access  Public
router.get("/", readArticles);

// @route   GET api/article/:slug
// @desc    Read an article based on slug
// @access  Public
router.get("/:slug", readArticle);

// @route   PUT api/article/:slug
// @desc    Edit an article based on slug
// @access  Private
router.put("/:slug", auth, editArticle);

// @route   DELETE api/article/:slug
// @desc    Delete an article based on slug
// @access  Private
router.delete("/:slug", auth, deleteArticle);

// @route   PUT api/article/:slug/like
// @desc    Like an article based on slug
// @access  Private
router.put("/:slug/like", auth, likeArticle);

export default router;

