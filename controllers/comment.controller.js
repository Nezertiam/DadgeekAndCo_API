// Librairies
import { validationResult } from "express-validator";
import sanitizer from "sanitizer";

// Models
import User from "../models/User.js";
import Article from "../models/Article.js";
import Comment from "../models/Comment.js";

// Services
import response from "../services/response.js";





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
    if (typeof req.body.slug !== 'string') errors.push({ ...response.errors.badSyntax("slug") });
    if (typeof req.body.text !== 'string') errors.push({ ...response.errors.badSyntax("text") });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });




    // STEP 3 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate slug
    slug = sanitizer.sanitize(req.body.slug);
    if (slug !== req.body.slug) errors.push({ ...response.errors.invalidChars("Slug") });
    if (!slug) errors.push({ ...response.errors.empty("slug") });

    // Validate text
    text = sanitizer.sanitize(req.body.text);
    if (text !== req.body.text) errors.push({ ...response.errors.invalidChars("text") });
    if (!text) errors.push({ ...response.errors.empty("text") });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 4 : GRANT PERSMISSION

    // Validate user
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });

    // Validate article
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ ...response.errors.notFound("Article") });





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
        res.status(201).json({ ...response.success.created("article"), data: comment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ...response.errors.server() });
    }
}


// @route GET /api/comment/:id
/**
 * Read a specific comment
 */
export const readComment = async (req, res) => {
    // Check id
    if (req.params.id.length !== 12 && req.params.id.length !== 24) return res.status(400).json({ ...response.errors.invalidId() })

    // Get comment
    let comment = await Comment.findOne({ _id: req.params.id });
    if (!comment || (comment && comment.deleted === true)) return res.status(404).json({ ...rror.notFound("Comment") });

    // Return comment
    return res.json({ data: comment });
}


// @Route PUT /api/comment/:id
/**
 * Edit a specific comment
 */
export const editComment = async (req, res) => {

    // Check id
    if (req.params.id.length !== 12 && req.params.id.length !== 24) return res.status(400).json({ ...response.errors.invalidId() })

    let errors = [];


    // STEP 1 : CHECK FIELDS TYPE, GRANT USER, FIND ARTICLE TO AVOID EXECUTION ERRORS

    // Check types
    if (req.body.text && typeof req.body.text !== 'string') errors.push({ ...response.errors.badSyntax("text") });
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 2 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate text
    let text = sanitizer.sanitize(req.body.text);
    if (text !== req.body.text) errors.push({ ...response.errors.invalidChars("text") });
    if (!text) errors.push({ ...response.errors.empty("text") });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 3 : GRANT PERSMISSION

    // Get comment by id
    const comment = await Comment.findOne({ _id: req.params.id });
    if (!comment || (comment && comment.deleted === true)) return res.status(404).json({ ...response.errors.notFound("comment") });

    // Get user
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });

    // Check if user is the comment author
    if (!user.equals(comment.user) && !user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.builder(401, "Can't edit a comment that isn't yours") });

    // Text has to change
    if (text === comment.text) return res.status(400).json({ ...response.builder(400, "Text must be different to edit the comment") })



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
        return res.status(200).json({ ...response.success.edited("comment"), data: editedComment });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ...response.errors.server() });
    }
}


// @Route DELETE /api/comment/:id
/**
 * Delete a specific comment
 */
export const deleteComment = async (req, res) => {

    // Check id
    if (req.params.id.length !== 12 && req.params.id.length !== 24) return res.status(400).json({ ...response.errors.invalidId() })

    // Get user
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });

    // Get comment
    const comment = await Comment.findOne({ _id: req.params.id });
    if (!comment) return res.status(404).json({ ...response.errors.notFound("comment") });

    // Check if comment is already deleted
    if (comment.deleted) return res.status(404).json({ ...response.errors.notFound("comment") });

    // Grant permission
    if (!user.equals(comment.user) && !user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.builder(201, "Can't delete a comment that isn't yours") });

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
        return res.status(200).json({ ...response.success.deleted("comment") });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ...response.errors.server() });
    }
}


// @Route PUT /api/comment/:id/like
/**
 * Like a specific comment
 */
export const likeComment = async (req, res) => {

    // Check id
    if (req.params.id.length !== 12 && req.params.id.length !== 24) return res.status(400).json({ ...response.errors.invalidId() })

    // Get comment
    const comment = await Comment.findOne({ _id: req.params.id });
    if (!comment || (comment && comment.deleted === true)) return res.status(400).json({ ...response.errors.notFound("comment") })

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
            return res.status(200).json({ ...response.builder(200, "Comment liked") });
        } else {
            return res.status(200).json({ ...response.builder(200, "Comment disliked") })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ...response.errors.server() });
    }
}