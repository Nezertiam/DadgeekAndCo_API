import { validationResult } from "express-validator";
import User from "../models/User.js";
import Article from "../models/Article.js";
import Comment from "../models/Comment.js";
import sanitizer from "sanitizer";


// @route POST /api/comment
/**
 * Create a new comment for an article
 */
export const createComment = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get body content
    let { slug, text } = req.body;
    if (!slug) return res.status(400).json({ message: "Slug missing" });
    if (!text) return res.status(400).json({ message: "Comment content missing" });

    // Sanitize body content
    slug = sanitizer.sanitize(req.body.slug);
    text = sanitizer.sanitize(req.body.text);
    if (!slug) return res.status(400).json({ message: "Slug contains invalid characters" });
    if (!text) return res.status(400).json({ message: "Comment content contains invalid characters" });

    // Check user exists
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check article exists
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ message: "Article not found" });

    // Set data
    const commentFields = {};
    commentFields.user = req.user.id;
    commentFields.article = article.id;
    commentFields.text = text;

    // Save comment
    try {
        const comment = new Comment(commentFields)
        await comment.save();
        res.status(201).json({ message: "Comment successfully created!", data: comment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}


// @route POST /api/comment/:id
/**
 * Read a specific comment
 */
export const readComment = async (req, res) => {
    // Get id
    let id = sanitizer.sanitize(req.params.id);
    if (!id) return res.status(400).json({ message: "Id contains unvalid characters" })

    // Get comment
    let comment = await Comment.findOne({ _id: req.params.id });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Return comment
    return res.json({ comment });
}