// Librairies
import { validationResult } from "express-validator";
import sanitizer from "sanitizer";
import slugify from "slugify";
import uuid from "uuid/v4.js";

// Models
import User from "../models/User.js";
import Category from "../models/Category.js";

// Services
import response from "../services/response.js";





// @Route POST /api/category
/**
 * Create a new category
 */
export const createCategory = async (req, res) => {

    // STEP 1 : LET EXPRESS CHECK REQUIRED FIELDS

    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    errors = [];



    // STEP 2 : CHECK TYPES AND GRANT PERSMISSION TO AVOID EXECUTION ERRORS

    // check types
    if (typeof req.body.title !== 'string') errors.push({ ...response.errors.badSyntax("Title") });
    if (req.body.description && typeof req.body.description !== 'string') errors.push({ ...response.errors.badSyntax("description") });
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Get user and grant permissions
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });
    if (!user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.errors.unauthorized() });



    // STEP 3 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate title
    const title = sanitizer.sanitize(req.body.title);
    if (title !== req.body.title) errors.push({ ...response.errors.invalidChars("title") });

    // Create slug based on title
    const slug = slugify(title);
    const category = await Category.findOne({ slug: slug });
    if (category) errors.push({ ...response.builder(400, "Category already exists.") });

    // Validate facultative description
    let description;
    if (req.body.description) description = sanitizer.sanitize(req.body.description);
    if (description !== req.body.description) errors.push({ ...response.errors.invalidChars("description") });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 4 : SET THE GENERATED DATA

    // Set data
    const categoryFields = {
        title,
        slug,
        description
    };



    // STEP 5 : SAVE THE DATA

    try {
        const category = new Category(categoryFields);
        await category.save();
        return res.status(201).json({ ...response.success.created("Category"), data: category });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ...response.errors.server() });
    }
}


// @Route GET /api/category
/**
 * Get categories
 */
export const getCategories = async (req, res) => {
    // Get categories
    const categories = await Category.find().sort({ title: "asc" });

    if (categories.length < 1) return res.status(404).json({ ...response.builder(404, "No categories created yet") })
    return res.status(200).json({ ..."Categories found", data: categories });
}


// @Route GET /api/category/:slug
/**
 * Get a category by slug
 */
export const getCategory = async (req, res) => {
    // Get category
    const category = await Category.findOne({ slug: req.params.slug })
    if (!category) return res.status(404).json({ ...response.errors.notFound("Category") });

    return res.status(200).json({ ...response.success.found("Category"), data: category });
}


// @Route PUT /api/category/:slug
/**
 * Edit a category
 */
export const editCategory = async (req, res) => {

    let errors = [];


    // STEP 1 : CHECK FIELDS TYPE, GRANT USER, FIND ARTICLE TO AVOID EXECUTION ERRORS

    // Check types
    if (req.body.description && typeof req.body.description !== 'string') errors.push({ ...response.errors.badSyntax("description") });
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Get user and grant permission
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });
    if (!user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.errors.unauthorized() })

    // Get category
    const category = await Category.findOne({ slug: req.params.slug })
    if (!category) return res.status(404).json({ ...response.errors.notFound("Category") });



    // STEP 2 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate facultative description
    let description;
    if (req.body.description) {
        description = sanitizer.sanitize(req.body.description);
        if (description !== req.body.description) errors.push({ ...response.errors.invalidChars("description") });
    }

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 3 : SET FIELDS DATAS

    const categoryFields = {
        description
    };



    // STEP 4 : SAVE DATAS

    // save changes
    try {
        const editedCategory = await Category.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: categoryFields },
            { new: true }
        );
        return res.status(200).json({ ...response.success.edited("Category"), data: editedCategory });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ...response.errors.server() });
    }
}


// @Route DELETE /api/category/:slug
/**
 * Delete a category
 */
export const deleteCategory = async (req, res) => {
    // Get user and permission
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });
    if (!user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.errors.unauthorized() });

    // Get category
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ ...response.errors.notFound("Category") });

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
        return res.status(200).json({ ...response.success.deleted() });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ...response.errors.server() });
    }
}