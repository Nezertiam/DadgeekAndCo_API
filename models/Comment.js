import mongoose from "mongoose";

const CommentSchema = mongoose.Schema(
    {
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "article"
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        text: {
            type: String,
            required: true
        },
        revisions: {
            type: [Object]
        },
        deleted: {
            type: Boolean,
            default: false
        },
        likes: {
            type: [String],
            default: []
        },
        nblikes: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
)

const Comment = mongoose.model("comment", CommentSchema);
export default Comment;