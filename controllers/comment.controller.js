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


// @route GET /api/comment/:id
/**
 * Read a specific comment
 */
export const readComment = async (req, res) => {
    // Get id
    let id = sanitizer.sanitize(req.params.id);
    if (!id) return res.status(400).json({ message: "Id contains unvalid characters" })

    // Get comment
    let comment = await Comment.findOne({ _id: req.params.id });
    if (!comment || (comment && comment.deleted === true)) return res.status(404).json({ message: "Comment not found" });

    // Return comment
    return res.json({ data: comment });
}


// @Route PUT /api/comment/:id
/**
 * Edit a specific comment
 */
export const editComment = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get comment by id
    const comment = await Comment.findOne({ _id: req.params.id });
    if (!comment || (comment && comment.deleted === true)) return res.status(404).json({ message: "Comment not found" });

    // Get user
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user is the comment author
    if (!user.equals(comment.user) && !user.isGranted("ROLE_ADMIN")) return res.status(400).json({ message: "Can't edit a comment that isn't yours" });

    // Get body content
    let text = sanitizer.sanitize(req.body.text);
    if (!text) return res.status(400).json({ message: "Invalid content" });

    // Text has to change
    if (text === comment.text) return res.status(400).json({ message: "Text must be different to edit the comment" })

    // Set data
    let commentFields = {}
    const commentRevised = {
        text: comment.text,
        updatedAt: comment.updatedAt
    }
    let revisionsTable = comment.revisions;
    revisionsTable.push(commentRevised);
    commentFields.revisions = revisionsTable;
    commentFields.text = text;



    // Save data
    try {
        const editedComment = await Comment.findOneAndUpdate(
            { _id: comment.id },
            { $set: commentFields },
            { new: true }
        )
        return res.status(200).json({ message: "Comment edited successfully", data: editedComment });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}


// @Route DELETE /api/comment/:id
/**
 * Delete a specific comment
 */
export const deleteComment = async (req, res) => {

    // Get comment
    const comment = await Comment.findOne({ _id: req.params.id });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Get user
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if comment is already deleted
    if (comment.deleted) return res.status(404).json({ message: "Comment not found" });

    // Grant permission
    if (!user.equals(comment.user) && !user.isGranted("ROLE_ADMIN")) return res.status(400).json({ message: "Can't edit a comment that isn't yours" });

    // Set a new revision
    let revisionsTable = comment.revisions;
    const commentRevised = {
        text: comment.text,
        updatedAt: comment.updatedAt
    }
    revisionsTable.push(commentRevised);

    // Set data
    let commentFields = {
        text: "Comment deleted",
        deleted: true,
        revisions: revisionsTable
    };

    // Save changes
    try {
        await Comment.findOneAndUpdate(
            { _id: req.params.id },
            { $set: commentFields },
            { new: true }
        );
        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}


// @Route PUT /api/comment/:id/like
/**
 * Like a specific comment
 */
export const likeComment = async (req, res) => {
    // Get comment
    const comment = await Comment.findOne({ _id: req.params.id });
    if (!comment || (comment && comment.deleted === true)) return res.status(400).json({ message: "Comment not found" })

    // get like array
    const likes = comment.likes;

    // If is in array, dislike, else like
    if (likes.includes(req.user.id)) {
        const index = likes.indexOf(req.user.id);
        if (index > -1) likes.splice(index, 1);
    } else {
        likes.push(req.user.id);
    }

    try {
        await Comment.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { likes } },
            { new: true }
        );
        return res.status(200).json({ message: "Comment successfully liked" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}