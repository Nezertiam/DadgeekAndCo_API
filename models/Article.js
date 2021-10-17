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
        photo: {
            type: String
        },
        description: {
            type: String
        },
        blocks: [Object]
    },
    { timestamps: true }
)

const Article = mongoose.model("Article", ArticleSchema);
export default Article;