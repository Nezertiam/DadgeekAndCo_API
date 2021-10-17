import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        slug: {
            type: String,
            required: true,
            unique: true
        },
        photo: {
            type: String
        },
        description: {
            type: String
        },
        blocks: {
            type: [Object],
            required: true
        }
    },
    { timestamps: true }
)

const Article = mongoose.model("Article", ArticleSchema);
export default Article;