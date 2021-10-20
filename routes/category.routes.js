import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";
import { createCategory, getCategories, getCategory, editCategory, deleteCategory } from "../controllers/category.controller.js";

const router = express.Router();


// @Route   POST api/category
// @Desc    Create a new category
// @access  Private
router.post("/", auth, [
    check("title", "Title is required.").not().isEmpty()
], createCategory);

// @Route   GET api/category
// @Desc    Get categories
// @access  Public
router.get("/", getCategories);

// @Route   GET api/category/:slug
// @Desc    Get category by slug
// @access  Public
router.get("/:slug", getCategory);

// @Route   PUT api/category/:slug
// @Desc    Edit by slug
// @access  Private
router.put("/:slug", auth, editCategory);

// @Route   DELETE api/category/:slug
// @Desc    Delete category by slug
// @access  Private
router.delete("/:slug", auth, deleteCategory);

export default router;