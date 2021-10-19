import { validationResult } from "express-validator";
import Article from "../models/Article.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import slugify from "slugify";
import isGranted from "../services/isGranted.js";
import sanitizer from "sanitizer";

// @route POST /api/article
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
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only Authors and Admin can create an article
    const permission = isGranted("ROLE_AUTHOR", user);
    if (!permission) return res.status(400).json({ message: "You don't have the permission to do that" });

    // Get the body content
    let { title, description, blocks } = req.body;
    if (!title) return res.status(400).json({ message: "Title missing" });
    if (!description) return res.status(400).json({ message: "Description missing" });
    if (typeof blocks !== 'object') return res.status(400).json({ message: "Bad syntax" });
    if (blocks.length === 0) return res.status(400).json({ message: "Article content missing" });

    // Sanitize all fields
    let rawTitle = title;
    title = sanitizer.sanitize(req.body.title);
    if (!title || title !== rawTitle) return res.status(400).json({ message: "Title contains unvalid characters" })
    description = sanitizer.sanitize(req.body.description);
    if (!description) return res.status(400).json({ message: "Decription contains unvalid characters" })
    blocks = [];
    req.body.blocks.map((block) => {
        const safeBlock = {};
        safeBlock.type = sanitizer.sanitize(block.type);
        safeBlock.content = sanitizer.sanitize(block.content);
        blocks.push(safeBlock);
    })

    // Create slug based on title
    let slug = slugify(title);
    slug = sanitizer.sanitize(slug);
    if (!slug) return res.status(400).json({ message: "Title contains unvalid characters" })

    // Test if article already exists based on slug
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

    const comments = await Comment.find({ article: article.id }).sort({ date: 'desc' })

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
    if (!isGranted("ROLE_AUTHOR", user)) return res.status(400).json({ message: "You can't modify content since you're not an author anymore" })

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
    if (!user.equals(article.user) && !isGranted("ROLE_ADMIN", user)) return res.status(400).json({ message: "You can't modify an article that isn't yours" });

    // The user must still be an anthor to be able to modify its articles
    if (!isGranted("ROLE_AUTHOR", user)) return res.status(400).json({ message: "You can't modify content since you're not an author anymore" });

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