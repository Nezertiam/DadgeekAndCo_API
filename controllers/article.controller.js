// Librairies
import { validationResult } from "express-validator";
import slugify from "slugify";
import sanitizer from "sanitizer";

// Models
import Article from "../models/Article.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Category from "../models/Category.js";

// Services
import validate from "../services/validation.js";
import response from "../services/response.js"



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
    if (typeof req.body.title !== 'string') errors.push({ ...response.errors.badSyntax("title") });
    if (req.body.description && typeof req.body.description !== 'string') errors.push({ ...response.errors.badSyntax("description") });
    if (req.body.content && typeof req.body.content !== 'string') errors.push({ ...response.errors.badSyntax("content") });
    if (!Array.isArray(req.body.categories)) errors.push({ ...response.errors.badSyntax("categories") });
    // Return errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });


    // Get user and grant permission
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });
    if (!user.isGranted("ROLE_AUTHOR")) return res.status(401).json({ ...response.errors.unauthorized() });

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });




    // STEP 3 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate required title
    const title = sanitizer.sanitize(req.body.title);
    if (title !== req.body.title) errors.push({ ...response.errors.invalidChars("title") });
    if (!title) errors.push({ ...response.errors.empty("title") });

    // Create slug based on title
    let slug = slugify(title, { lower: true, trim: true });
    slug = sanitizer.sanitize(slug);
    if (!slug) errors.push({ ...response.errors.creationFailed("slug", "title") });
    // Test if article already exists based on slug
    const article = await Article.findOne({ slug: slug });
    if (article) errors.push({ ...response.builder(400, "Title already taken. Maybe you already published this article?") });

    // Validate facultative description
    let description;
    if (req.body.description) description = sanitizer.sanitize(req.body.description);
    if (description !== req.body.description) errors.push({ ...response.errors.invalidChars("description") });

    // Validate content
    let content;
    if (req.body.content) content = sanitizer.sanitize(req.body.content);
    if (content !== req.body.content) errors.push({ ...response.errors.invalidChars("content") });

    // Check if categories exist
    const results = await validate.categories(req.body.categories); // TODO : Turn this function into a promise
    if (!results.fullfilled) errors.push({ errorsOnCategories: results.errors });
    const categories = results.data;

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 4 : SET THE GENERATED DATA

    const articleFields = {
        user: req.user.id,
        slug: slug,
        categories: categories,
        title,
        description,
        content
    }



    // STEP 5 : SAVE THE DATA

    try {
        const article = new Article(articleFields)
        await article.save();
        res.status(201).json({ ...response.success.created("article"), data: article });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ...response.errors.server() });
    }
}


//@ Route GET /api/article
/**
 * Return all articles with filters
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
        if (!categoryObject) return res.status(404).json({ ...response.errors.notFound("category") });
        articles = await Article.find({ categories: categoryObject.id }).skip(skip).limit(limit);
    } else {
        articles = await Article.find().skip(skip).limit(limit)
    }

    if (articles.length < 1) return res.status(404).json({ ...response.builder(404, "No more articles or no articles created yet.") });
    return res.status(200).json({ ...response.success.found("Articles"), data: articles });
}


// @route GET /api/article/:slug
/**
 * Get and return the article by the slug
 */
export const readArticle = async (req, res) => {
    // Get the slug for db search
    const slug = sanitizer.sanitize(req.params.slug);
    if (!slug) return res.status(400).json({ ...response.errors.invalidChars("Slug") })

    // Get the article with the slug
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ ...response.errors.notFound("article") });

    const comments = await Comment.find({ article: article.id }).sort({ nblikes: 'desc' })

    // Return the article
    return res.json({ ...response.success.found("Article"), data: { article, comments } });
}


// @route PUT /api/article/:slug
/**
 * Edit an article found by its slug
 */
export const editArticle = async (req, res) => {

    let errors = [];


    // STEP 1 : CHECK FIELDS TYPE, GRANT USER, FIND ARTICLE TO AVOID EXECUTION ERRORS

    // Check types
    if (req.body.title && typeof req.body.title !== 'string') errors.push({ ...response.errors.badSyntax("title") });
    if (req.body.description && typeof req.body.description !== 'string') errors.push({ ...response.errors.badSyntax("description") });
    if (req.body.content && typeof req.body.content !== 'string') errors.push({ ...response.errors.badSyntax("content") });
    if (req.body.categories && req.body.categories === "object" && !Array.isArray(req.body.categories)) errors.push({ ...response.errors.badSyntax("categories") });
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Get user
    const user = req.user
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });

    // find article by slug
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(404).json({ ...response.errors.notFound("Article") });

    // Grant permission (article author + admin)
    if (!user.equals(article.user) && !user.isGranted("ROLE_ADMIN")) return res.status(400).json({ ...response.builder(400, "You can't modify an article that isn't yours.") });
    if (!user.isGranted("ROLE_AUTHOR")) return res.status(400).json({ ...response.builder(400, "You can't modify content since you're not an author anymore.") })

    // End of step, returns errors
    if (errors.length > 0) return res.status(400).json({ errors: errors });



    // STEP 2 : VALIDATE AND GENERATE FIELDS DATAS

    // Validate facultative title
    let title;
    let slug;
    if (req.body.title) {
        title = sanitizer.sanitize(req.body.title);
        if (title !== req.body.title) errors.push({ ...response.errors.invalidChars("title") });
        // Create slug based on title
        slug = slugify(title, { lower: true, trim: true });
        slug = sanitizer.sanitize(slug);
        if (!slug) errors.push({ ...response.errors.creationFailed("slug", "title") });
        // Test if article already exists based on slug
        const article = await Article.findOne({ slug: slug });
        if (article) errors.push({ ...response.builder(400, "Title already taken. Maybe you already published this article?") });
    }

    // Validate facultative description
    let description;
    if (req.body.description) {
        description = sanitizer.sanitize(req.body.description);
        if (description !== req.body.description) errors.push({ ...response.errors.invalidChars("description") });
    }

    // Validate facultative content
    let content;
    if (req.body.content) {
        if (req.body.content) content = sanitizer.sanitize(req.body.content);
        if (content !== req.body.content) errors.push({ ...response.errors.invalidChars("content") });
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
    if (typeof description === typeof categories && typeof categories === typeof content) return res.status(400).json({ ...response.builder(400, "Nothing to update.") });


    // STEP 3 : SET FIELDS DATAS

    const articleFields = {
        title,
        slug,
        description,
        categories,
        content
    };



    // STEP 4 : SAVE DATAS

    try {
        const editedArticle = await Article.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: articleFields },
            { new: true }
        );

        return res.status(200).json({ ...response.success.edited("Article"), data: editedArticle });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ ...response.errors.server() })
    }
}

// @route DELETE /api/article/:slug
/**
 * Delete an article using its slug to find it
 */
export const deleteArticle = async (req, res) => {

    // Get the user with the id in the token
    const user = req.user;
    if (!user) return res.status(401).json({ ...response.errors.invalidToken() });

    // find article by slug
    const slug = sanitizer.sanitize(req.params.slug);
    if (!slug) return res.status(400).json({ ...response.errors.invalidChars("Slug") })
    const article = await Article.findOne({ slug: slug });
    if (!article) return res.status(404).json({ ...response.errors.notFound("Article") });

    // Only the author can modify its articles
    if (!user.equals(article.user) && !user.isGranted("ROLE_ADMIN")) return res.status(400).json({ ...response.builder(400, "You can't delete an article that isn't yours.") });

    // The user must still be an anthor to be able to delete its articles
    if (!user.isGranted("ROLE_AUTHOR")) return res.status(400).json({ ...response.builder(400, "You can't delete article since you're not an author anymore.") });

    try {
        await Article.findOneAndDelete({ slug: slug });
        await Comment.deleteMany({ article: article.id });
        return res.status(200).json({ ...response.success.deleted("Article and its comments") })
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({ ...response.errors.server() })
    }
}


// @Route PUT /api/article/:slug/like
/**
 * Like a specific comment
 */
export const likeArticle = async (req, res) => {
    // Get comment
    const article = await Article.findOne({ slug: req.params.slug });
    if (!article) return res.status(400).json({ ...response.errors.notFound("Article") })

    // get like array
    const likes = article.likes;
    let bool = false;

    // If is in array, dislike, else like
    if (likes.includes(req.user.id)) {
        const index = likes.indexOf(req.user.id);
        if (index > -1) likes.splice(index, 1);
    } else {
        likes.push(req.user.id);
        bool = true;
    }

    try {
        await Article.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: { likes } },
            { new: true }
        );
        if (bool) {
            return res.status(200).json({ ...response.builder(200, "Article liked!") });
        } else {
            return res.status(200).json({ ...response.builder(200, "Article disliked!") });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ...response.errors.server() });
    }
}