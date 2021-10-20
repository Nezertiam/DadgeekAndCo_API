import { validationResult } from "express-validator";
import sanitizer from "sanitizer";
import slugify from "slugify";
import uuid from "uuid/v4.js";

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
    if (!user.isGranted("ROLE_ADMIN")) return res.status(401).json({ message: "No permission" });

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
    // Get categories
    const categories = await Category.find().sort({ title: "asc" });

    if (categories.length < 1) return res.status(200).json({ message: "No categories created yet", data: [] })
    return res.status(200).json({ message: "Categories found", data: categories });
}


// @Route GET /api/category/:slug
/**
 * Get a category by slug
 */
export const getCategory = async (req, res) => {
    // Get category
    const category = await Category.findOne({ slug: req.params.slug })
    if (!category) return res.status(404).json({ message: "Category not found" });

    return res.status(200).json({ message: "Category found", data: category });
}


// @Route PUT /api/category/:slug
/**
 * Edit a category
 */
export const editCategory = async (req, res) => {
    // Get user and grant permission
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isGranted("ROLE_ADMIN")) return res.status(401).json({ message: "No permission" })

    // Get category
    const category = await Category.findOne({ slug: req.params.slug })
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Get body content and set data
    let categoryFields = {};
    if (req.body.title) {
        const title = sanitizer.sanitize(req.body.title);
        if (title !== req.body.title) return res.status(400).json({ message: "Title contains invalid characters" });
        categoryFields.title = title;
    }
    if (req.body.description) {
        const desc = sanitizer.sanitize(req.body.description);
        if (desc !== req.body.description) return res.status(400).json({ message: "Description contains invalid characters" });
        categoryFields.description = desc;
    }

    // save changes
    try {
        const editedCategory = await Category.findOneAndUpdate(
            { slug: category.slug },
            { $set: categoryFields },
            { new: true }
        );
        return res.status(200).json({ message: "Category edited successfully", data: editedCategory });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}


// @Route DELETE /api/category/:slug
/**
 * Delete a category
 */
export const deleteCategory = async (req, res) => {
    // Get user and permission
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isGranted("ROLE_ADMIN")) return res.status(401).json({ message: "No permission" });

    // Get category
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Set slug
    const slug = slugify("deleted " + uuid() + " " + uuid())

    // Set fake data
    const categoryFields = {
        title: "[Category deleted]",
        slug: slug,
        description: "Category deleted",
        articles: [],
        deleted: true
    }

    // save
    try {
        await Category.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: categoryFields },
            { new: true }
        )
        return res.status(200).json({ message: "Category deleted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}