import Category from "../../models/Category.js";

/**
 * Filters the blocks array and returns blocks for save or the errors.
 * 
 * @param {[{ type: String, content: String }]} categoriesId
 * 
 * @returns {{
 *      fullfilled: boolean, 
 *      data: [{
 *          type: String, 
 *          content: String
 *      }], 
 *      errors: [{
 *          message: String
 *      }] 
 * }}
 */
const categoriesValidation = async (categoriesId) => {

    let isLegalArray = true;

    let results = {
        fullfilled: false,
        data: [],
        errors: []
    }

    // Checks if only strings in array
    categoriesId.map((category) => {
        if (typeof category !== "string") isLegalArray = false;
    })


    if (isLegalArray) {
        // Get categories
        const categories = await Category.find({
            '_id': { $in: categoriesId }
        });

        // Check if all ids matches a category
        if (categories.length !== categoriesId.length) {
            results.errors.push({ message: "One or more categories don't exist" });
            return results;
        }

        // Checks if one or more category is "deleted"
        let bool = false;
        categories.map((category) => {
            if (category.deleted === true) bool = true;
        });
        if (bool) {
            results.errors.push({ message: "One or more categories don't exist" });
            return results;
        }

        // Return results with good news :)
        results.data = categoriesId;
        results.fullfilled = true;
        return results;
    }

    results.errors.push({ message: "Bad syntax on categories property" })
    return results;

}


export default categoriesValidation;