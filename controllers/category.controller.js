import { validationResult } from "express-validator";
import sanitizer from "sanitizer";
import slugify from "slugify";

import User from "../models/User.js";
import Category from "../models/Category.js";


// @Route POST /api/category
/**
 * Create a new category
 */
export const createCategory = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get user and grant permissions
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isGranted("ROLE_ADMIN")) return res.status(400).json({ message: "No permission" });

    // Get body content
    const title = sanitizer.sanitize(req.body.title);
    if (title !== req.body.title) return res.status(400).json({ message: "Title contains invalid characters" });

    let desc;
    if (req.body.description) {
        desc = sanitizer.sanitize(req.body.description);
        if (desc !== req.body.description) return res.status(400).json({ message: "Description contains invalid characters" });
    }

    // Create slug
    const slug = slugify(title);

    // Set data
    const categoryFields = { title, slug };
    if (desc) categoryFields.description = desc;

    try {
        const category = new Category(categoryFields);
        await category.save();
        return res.status(201).json({ message: "Category created!", data: category });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}


// @Route GET /api/category
/**
 * Get categories
 */
export const getCategories = async (req, res) => {
    const categories = await Category.find().sort({ title: "asc" });

    if (categories.length < 1) return res.status(200).json({ message: "No categories created yet", data: [] })
    return res.status(200).json({ message: "Categories found", data: categories });
}