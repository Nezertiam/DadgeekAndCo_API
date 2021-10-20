import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    articles: {
        type: [mongoose.Schema.Types.String],
        default: []
    }
})

const Category = mongoose.model("category", CategorySchema);
export default Category;