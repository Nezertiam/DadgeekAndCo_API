import { validationResult } from "express-validator";
import Article from "../models/Article.js"
import slugify from "slugify";

// @route /api/article
/**
 * Create a new article
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const createArticle = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get the body content and hydrate a new article object, then save it
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
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const readArticle = async (req, res) => {
    const slug = req.params.slug;

    const article = await Article.findOne({ slug: slug });

    if (!article) return res.status(404).json({ message: "Article not found" });

    return res.json({ article })
}


// @route /api/article/:slug
/**
 * Edit an article found by its slug
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export const editArticle = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const slug = req.params.slug;
    const article = await Article.findOne({ slug: slug });

    if (!article) return res.status(404).json({ message: "Article not found" });

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
        res.status(500).json({ message: "Server error." })
    }

}