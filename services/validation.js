import { default as blocks } from "./validation/blocksValidation.js";
import { default as categories } from "./validation/categoriesValidation.js";

const validate = {
    blocks: blocks,
    categories: categories
}

export default validate;