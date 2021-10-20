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

    // STEP 1 : LET EXPRESS CHECK REQUIRED FIELDS

    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    errors = []    // reset errors



    // STEP 2 : CHECK TYPES TO AVOID EXECUTION ERRORS

    // Check types
    if (typeof req.body.slug !== 'string') errors.push({ message: "Bad syntax on slug property" });
    if (typeof req.body.text !== 'string') errors.push({ message: "Bad syntax on text property" });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });




    // STEP 3 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate slug
    slug = sanitizer.sanitize(req.body.slug);
    if (slug !== req.body.slug) errors.push({ message: "Slug contains invalid characters" });
    if (!slug) errors.push({ message: "Slug cannot be empty" });

    // Validate text
    text = sanitizer.sanitize(req.body.text);
    if (text !== req.body.text) errors.push({ message: "Comment content contains invalid characters" });
    if (!text) errors.push({ message: "Text cannot be empty" });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 4 : GRANT PERSMISSION

    // Validate user
    const user = await User.findOne({ _id: req.user.id });
    if (!user) errors.push({ message: "User not found" });

    // Validate article
    const article = await Article.findOne({ slug: slug });
    if (!article) errors.push({ message: "Article not found" });

    // End of step, returns errors
    if (errors.length > 0) return res.status(404).json({ errors: errors });




    // STEP 5 : SET FIELDS DATAS

    const commentFields = {
        user: req.user.id,
        article: article.id,
        text: text
    };



    // STEP 6 : SAVE DATAS

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

    let errors = [];


    // STEP 1 : CHECK FIELDS TYPE, GRANT USER, FIND ARTICLE TO AVOID EXECUTION ERRORS

    // Check types
    if (req.body.text && typeof req.body.text !== 'string') errors.push({ message: "Bad syntax on text property" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 2 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate text
    let text = sanitizer.sanitize(req.body.text);
    if (text !== req.body.text) errors.push({ message: "Invalid content" });
    if (!text) errors.push({ message: "Text must defined" });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 3 : GRANT PERSMISSION

    // Get comment by id
    const comment = await Comment.findOne({ _id: req.params.id });
    if (!comment || (comment && comment.deleted === true)) return res.status(404).json({ message: "Comment not found" });

    // Get user
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user is the comment author
    if (!user.equals(comment.user) && !user.isGranted("ROLE_ADMIN")) return res.status(400).json({ message: "Can't edit a comment that isn't yours" });

    // Text has to change
    if (text === comment.text) return res.status(400).json({ message: "Text must be different to edit the comment" })



    // STEP 4 : SET FIELDS DATAS

    const commentRevised = {
        text: comment.text,
        updatedAt: comment.updatedAt
    }

    let revisionsArray = comment.revisions;
    revisionsArray.push(commentRevised);

    const commentFields = {
        revisions: revisionsArray,
        text: text
    }



    // STEP 5 : SAVE DATA

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
    if (!user.equals(comment.user) && !user.isGranted("ROLE_ADMIN")) return res.status(401).json({ message: "Can't edit a comment that isn't yours" });

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
    let nblikes = likes.length;
    let hasLiked = true;

    // If is in array, dislike, else like
    if (likes.includes(req.user.id)) {
        const index = likes.indexOf(req.user.id);
        if (index > -1) likes.splice(index, 1);
        nblikes = likes.length;
        hasLiked = false;
    } else {
        likes.push(req.user.id);
        nblikes = likes.length;
        hasLiked = true;
    }

    try {
        await Comment.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { likes, nblikes } },
            { new: true }
        );
        if (hasLiked) {
            return res.status(200).json({ message: "Comment liked" });
        } else {
            return res.status(200).json({ message: "Comment disliked" })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
}