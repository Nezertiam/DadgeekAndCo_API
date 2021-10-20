import { validationResult } from "express-validator";
import slugify from "slugify";
import sanitizer from "sanitizer";
import mongoose from "mongoose";

import Article from "../models/Article.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Category from "../models/Category.js";
import validate from "../services/validation.js";

// @route POST /api/article
/**
 * Create a new article
 */
export const createArticle = async (req, res) => {

    // STEP 1 : LET EXPRESS CHECK REQUIRED FIELDS

    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    errors = []    // reset errors



    // STEP 2 : CHECK TYPES AND GRANT PERSMISSION TO AVOID EXECUTION ERRORS

    // Check types
    if (typeof req.body.title !== 'string') errors.push({ message: "Bad syntax on title property" });
    if (req.body.description && typeof req.body.description !== 'string') errors.push({ message: "Bad syntax on description property" });
    if (!Array.isArray(req.body.blocks)) errors.push({ message: "Bad syntax on blocks property" });
    if (!Array.isArray(req.body.categories)) errors.push({ message: "Bad syntax on categories property" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });
    // Blocks can't be empty array
    if (req.body.blocks.length < 1) return res.status(400).json({ message: "Article content missing" });

    // Get user and grant permission
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isGranted("ROLE_AUTHOR")) return res.status(401).json({ message: "Permission required" });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });




    // STEP 3 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate required title
    const title = sanitizer.sanitize(req.body.title);
    if (title !== req.body.title) errors.push({ message: "Title contains invalid characters" });
    if (!title) errors.push({ message: "Title cannot be empty" });

    // Create slug based on title
    let slug = slugify(title);
    slug = sanitizer.sanitize(slug);
    if (!slug) errors.push({ message: "Slug creation failed because of invalid title" });
    // Test if article already exists based on slug
    const article = await Article.findOne({ slug: slug });
    if (article) errors.push({ message: "Title already taken. Maybe you already published this article?" });

    // Validate facultative description
    let description;
    if (req.body.description) description = sanitizer.sanitize(req.body.description);
    if (description !== req.body.description) errors.push({ message: "Description contains invalid characters" });

    // Get blocks and verify all blocks
    const results = validate.blocks(req.body.blocks);
    if (!results.fullfilled) errors.push({ errorsOnBlocks: results.errors });
    const blocks = results.data;

    // Check if categories exist
    const results2 = await validate.categories(req.body.categories); // TODO : Turn this function into a promise
    if (!results2.fullfilled) errors.push({ errorsOnCategories: results2.errors });
    const categories = results2.data;

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 4 : SET THE GENERATED DATA

    const articleFields = {
        user: req.user.id,
        slug: slug,
        categories: categories,
        title,
        description,
        blocks
    }



    // STEP 5 : SAVE THE DATA

    try {
        const article = new Article(articleFields)
        await article.save();
        res.status(201).json({ message: "Article successfully created!", data: article });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}


//@ Route GET /api/article
/**
 * Return all articles with pagination
 */
export const readArticles = async (req, res) => {

    // Get query params
    let { page, size, category } = req.query;

    // If some params are missing
    if (!page) page = 1;
    if (!size) size = 10;

    // Need because params are Strings
    const limit = parseInt(size);

    // Set offset
    const skip = (parseInt(page) - 1) * limit;

    // exec queries
    let articles;
    if (category) {
        const categoryObject = await Category.findOne({ slug: category });
        if (!categoryObject) return res.status(404).json({ message: "Category not found" });
        articles = await Article.find({ categories: categoryObject.id }).skip(skip).limit(limit);
    } else {
        articles = await Article.find().skip(skip).limit(limit)
    }

    if (articles.length < 1) return res.status(404).json({ message: "No more articles or no articles created yet" });
    return res.status(200).json({ message: "Articles found", data: articles });
}


// @route GET /api/article/:slug
/**
 * Get and return the article by the slug
 */
export const readArticle = async (req, res) => {
    // Get the slug for db search
    const slug = sanitizer.sanitize(req.params.slug);
    if (!slug) return res.status(400).json({ message: "Slug contains unvalid characters" })

    // Get the article with the slug
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ message: "Article not found" });

    const comments = await Comment.find({ article: article.id }).sort({ nblikes: 'desc' })

    // Return the article
    return res.json({ data: { article, comments } })
}


// @route PUT /api/article/:slug
/**
 * Edit an article found by its slug
 */
export const editArticle = async (req, res) => {        // TODO : Refacto + block validation

    let errors = [];


    // STEP 1 : CHECK FIELDS TYPE, GRANT USER, FIND ARTICLE TO AVOID EXECUTION ERRORS

    // Check types
    if (req.body.description && typeof req.body.description !== 'string') errors.push({ message: "Bad syntax on description property" });
    if (req.body.blocks && typeof req.body.blocks === "object" && !Array.isArray(req.body.blocks)) errors.push({ message: "Bad syntax on blocks property" });
    if (req.body.categories && req.body.categories === "object" && !Array.isArray(req.body.categories)) errors.push({ message: "Bad syntax on categories property" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Get user
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // find article by slug
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Grant permission (article author + admin)
    if (!user.equals(article.user) && !user.isGranted("ROLE_ADMIN")) return res.status(400).json({ message: "You can't modify an article that isn't yours" });
    if (!user.isGranted("ROLE_AUTHOR")) return res.status(400).json({ message: "You can't modify content since you're not an author anymore" })

    // End of step returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });


    // STEP 2 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate facultative description
    let description;
    if (req.body.description) {
        description = sanitizer.sanitize(req.body.description);
        if (description !== req.body.description) errors.push({ message: "Description contains invalid characters" });
    }

    // Validate facultative blocks
    let blocks;
    if (req.body.blocks) {
        const results = validate.blocks(req.body.blocks);
        if (!results.fullfilled) errors.push({ errorsOnBlocks: results.errors });
        blocks = results.data;
    }

    // Validate facultative categories
    let categories;
    if (req.body.categories) {
        const results2 = await validate.categories(req.body.categories);
        if (!results2.fullfilled) errors.push({ errorsOnCategories: results2.errors });
        categories = results2.data;
    }

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });
    if (typeof description === typeof categories && typeof categories === typeof blocks) return res.status(400).json({ message: "Nothing to update" });


    // STEP 3 : SET FIELDS DATAS

    const articleFields = {
        description,
        categories,
        blocks
    };



    // STEP 4 : SAVE DATAS

    try {
        const editedArticle = await Article.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: articleFields },
            { new: true }
        );

        return res.status(200).json({ message: "Article edited successfully", data: editedArticle });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error" })
    }
}

// @route DELETE /api/article/:slug
/**
 * Delete an article using its slug to find it
 */
export const deleteArticle = async (req, res) => {

    // Get the user with the id in the token
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "Can't authenticate this user" });

    // find article by slug
    const slug = sanitizer.sanitize(req.params.slug);
    if (!slug) return res.status(400).json({ message: "Slug contains unvalid characters" })
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Only the author can modify its articles
    if (!user.equals(article.user) && !user.isGranted("ROLE_ADMIN")) return res.status(400).json({ message: "You can't modify an article that isn't yours" });

    // The user must still be an anthor to be able to modify its articles
    if (!user.isGranted("ROLE_AUTHOR")) return res.status(400).json({ message: "You can't modify content since you're not an author anymore" });

    try {
        await Article.findOneAndDelete({ slug: slug });
        await Comment.deleteMany({ article: article.id });
        return res.status(200).json({ message: "Article and comments deleted successfully" })
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error" })
    }
}


// @Route PUT /api/article/:slug/like
/**
 * Like a specific comment
 */
export const likeArticle = async (req, res) => {
    // Get comment
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(400).json({ message: "Article not found" })

    // get like array
    const likes = article.likes;

    // If is in array, dislike, else like
    if (likes.includes(req.user.id)) {
        const index = likes.indexOf(req.user.id);
        if (index > -1) likes.splice(index, 1);
    } else {
        likes.push(req.user.id);
    }

    try {
        await Article.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: { likes } },
            { new: true }
        );
        return res.status(200).json({ message: "Article successfully liked" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}