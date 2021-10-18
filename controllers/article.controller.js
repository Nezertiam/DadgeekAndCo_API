import { validationResult } from "express-validator";
import Article from "../models/Article.js";
import User from "../models/User.js";
import slugify from "slugify";
import isGranted from "../services/isGranted.js";
import mongoose from "mongoose";

// @route /api/article
/**
 * Create a new article
 */
export const createArticle = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get the user with the id in the token
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "Can't authenticate this user" });

    // Only Authors and Admin can create an article
    const permission = isGranted("ROLE_AUTHOR", user);
    if (!permission) return res.status(400).json({ message: "You don't have the permission to do that" });

    // Get the body content, slug the title and hydrate a new article object, then save it
    const { title, description, blocks } = req.body;
    const slug = slugify(title);
    const article = await Article.findOne({ slug: slug });
    if (article) return res.status(400).json({ message: "Title already taken. Maybe you already published this article?" });
    try {
        const article = new Article({
            user: req.user.id,
            slug: slug,
            title,
            description,
            blocks
        })
        await article.save();
        res.status(201).json({ message: "Article successfully created!", data: article });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}


// @route /api/article/:slug
/**
 * Get and return the article by the slug
 */
export const readArticle = async (req, res) => {
    // Get the slug for db search
    const slug = req.params.slug;

    // Get the article with the slug
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Return the article
    return res.json({ article })
}


// @route /api/article/:slug
/**
 * Edit an article found by its slug
 */
export const editArticle = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Get the user with the id in the token
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "Can't authenticate this user" });

    // find article by slug
    const slug = req.params.slug;
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Only the author can modify its articles
    if (!user.equals(article.user)) return res.status(400).json({ message: "You can't modify an article that isn't yours" });

    // The user must still be an anthor to be able to modify its articles
    if (!user.roles.includes("ROLE_AUTHOR")) return res.status(400).json({ message: "You can't modify content since you're not an author anymore" })


    const articleFields = {};
    const { description, blocks } = req.body;
    if (description) articleFields.description = description;
    if (blocks) articleFields.blocks = blocks;

    try {
        const editedArticle = await Article.findOneAndUpdate(
            { slug: slug },
            { $set: articleFields },
            { new: true }
        );

        return res.status(200).json(editedArticle);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error." })
    }
}