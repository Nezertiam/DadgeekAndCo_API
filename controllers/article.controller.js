import { validationResult } from "express-validator";
import slugify from "slugify";
import sanitizer from "sanitizer";
import mongoose from "mongoose";

import Article from "../models/Article.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Category from "../models/Category.js";

// @route POST /api/article
/**
 * Create a new article
 */
export const createArticle = async (req, res) => {
    // First, validate body content or return an error
    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });


    // reset errors
    errors = []

    // Get user and grant permission
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isGranted("ROLE_AUTHOR")) return res.status(400).json({ message: "Permission required" });


    // Check syntax
    if (typeof req.body.blocks !== 'object') errors.push({ message: "Bad syntax on blocks property" });
    if (typeof req.body.title !== 'string') errors.push({ message: "Bad syntax on title property" });
    if (req.body.description && typeof req.body.description !== 'string') errors.push({ message: "Bad syntax on description property" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });


    // Blocks can't be empty array
    if (req.body.blocks.length < 1) return res.status(400).json({ message: "Article content missing" });


    // Validate each field
    const title = sanitizer.sanitize(req.body.title);
    if (title !== req.body.title) errors.push({ message: "Title contains invalid characters" });
    if (!title) errors.push({ message: "Title cannot be empty" });

    const description = sanitizer.sanitize(req.body.description);
    if (description !== req.body.description) errors.push({ message: "Description contains invalid characters" });

    // Get blocks and apply verification for each one
    let blocks = [];
    let blocksErrors = []
    let counter = 1;
    req.body.blocks.map((block) => {
        // Check if type and content are defined in block
        if (!block.type) blocksErrors.push({ message: "Block n°" + counter + " is missing type" });
        if (!block.content) blocksErrors.push({ message: "Block n°" + counter + " is missing content" });

        // Sanitize fields
        const safeType = sanitizer.sanitize(block.type);
        if (!safeType || safeType !== block.type) blocksErrors.push({ message: "Block n°" + counter + " has invalid character for type" });
        const safeContent = sanitizer.sanitize(block.content);
        if (!safeContent || safeContent !== block.content) blocksErrors.push({ message: "Block n°" + counter + " has invalid character for content" });

        // Set data in final array
        const safeBlock = {
            type: safeType,
            content: safeContent
        };
        blocks.push(safeBlock);
        counter++;
    })
    if (blocksErrors.length > 0) return res.status(400).json({ errors: errors, blocksErrors: blocksErrors });



    // Check if categories exist
    const categories = await Category.find({
        '_id': { $in: req.body.categories }
    });
    if (categories.length !== req.body.categories.length) return res.status(400).json({ message: "One or more categories don't exist" });

    // Convert categories into id strings if category isn't "deleted"
    let boolError = false;
    categories.map((category) => {
        if (category.deleted === true) boolError = true;
    });
    if (boolError) return res.status(404).json({ message: "One or more categories don't exist" });


    // Create slug based on title
    let slug = slugify(title);
    slug = sanitizer.sanitize(slug);
    if (!slug) return res.status(400).json({ message: "Title contains invalid characters" })
    if (errors.length > 0) return res.status(400).json({ errors: errors });


    // Test if article already exists based on slug
    const article = await Article.findOne({ slug: slug });
    if (article) return res.status(400).json({ message: "Title already taken. Maybe you already published this article?" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });




    // set data
    const articleFields = {
        user: req.user.id,
        slug: slug,
        categories: req.body.categories,
        title,
        description,
        blocks
    }

    // save data
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
export const editArticle = async (req, res) => {

    // Get the user with the id in the token
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "Can't authenticate this user" });

    // find article by slug
    const slug = sanitizer.sanitize(req.params.slug);
    if (!slug) return res.status(400).json({ message: "Slug contains unvalid characters" })
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Only the author can modify its articles
    if (!user.equals(article.user)) return res.status(400).json({ message: "You can't modify an article that isn't yours" });

    // The user must still be an anthor to be able to modify its articles
    if (user.isGranted("ROLE_AUTHOR")) return res.status(400).json({ message: "You can't modify content since you're not an author anymore" })

    // Get body content
    let { description } = req.body;

    // Sanitize fields
    const articleFields = {};
    if (description) articleFields.description = sanitizer.sanitize(description);
    let blocks = [];
    req.body.blocks.map((block) => {
        const safeBlock = {};
        safeBlock.type = sanitizer.sanitize(block.type);
        safeBlock.content = sanitizer.sanitize(block.content);
        blocks.push(safeBlock);
    })
    if (blocks.length > 0) articleFields.blocks = blocks;

    try {
        const editedArticle = await Article.findOneAndUpdate(
            { slug: slug },
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