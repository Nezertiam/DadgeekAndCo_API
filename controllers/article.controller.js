import { validationResult } from "express-validator";
import Article from "../models/Article.js"
import slugify from "slugify";

// @route /api/article/new
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


// @route /api/article/:article_id
export const readArticle = (req, res) => {

}