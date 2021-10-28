import mongoose from "mongoose";

const ArticleSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        categories: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "category",
            default: []
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
        content: {
            type: String,
            required: true
        },
        likes: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
)

const Article = mongoose.model("Article", ArticleSchema);
export default Article;