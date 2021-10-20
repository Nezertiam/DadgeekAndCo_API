import express from "express";
import auth from "../middleware/auth.js";
import { check } from "express-validator";
import { createCategory, getCategories } from "../controllers/category.controller.js";

const router = express.Router();


// @Route   POST api/category
// @Desc    Create a new category
// @access  Private
router.post("/", auth, [
    check("title", "Title is required.").not().isEmpty()
], createCategory);

// @Route   GET api/categorie
// @Desc    Get categories
// @access  Public
router.get("/", getCategories);

export default router;