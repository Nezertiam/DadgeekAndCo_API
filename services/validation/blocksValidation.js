import sanitizer from "sanitizer";

/**
 * Filters the blocks array and returns blocks for save or the errors.
 * 
 * @param {[{ type: String, content: String }]} blocksArray
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
const validateArticleBlocks = (blocksArray) => {
    let validatedBlocks = [];
    let errors = []
    let counter = 1;

    let results = {
        fullfilled: false,
        data: [],
        errors: []
    }

    blocksArray.map((block) => {
        if (typeof block === "object" && !Array.isArray(block)) {
            // Check if type and content are defined in block
            if (!block.type) errors.push({ message: "Block n°" + counter + " is missing type" });
            if (!block.content) errors.push({ message: "Block n°" + counter + " is missing content" });

            if (typeof block.type === "string" && typeof block.content === "string") {
                // Sanitize fields
                const safeType = sanitizer.sanitize(block.type);
                if (!safeType || safeType !== block.type) errors.push({ message: "Block n°" + counter + " has invalid character for type" });
                const safeContent = sanitizer.sanitize(block.content);
                if (!safeContent || safeContent !== block.content) errors.push({ message: "Block n°" + counter + " has invalid character for content" });

                // Set data in final array
                const safeBlock = {
                    type: safeType,
                    content: safeContent
                };
                validatedBlocks.push(safeBlock);
            } else {
                if (typeof block.type === "string") {
                    errors.push({ message: "Bad syntax on content property" })
                } else {
                    errors.push({ message: "Bad syntax on type property" })
                }
            }
        } else {
            errors.push({ message: "Bad syntax on block property" })
        }

        // Increment counter to know the wrong blocks
        counter++;
    })

    // If errors, return the errors
    if (errors.length > 0) {
        results.errors = errors;
        return results;
    }

    results.fullfilled = true;
    results.data = validatedBlocks;
    return results;
}

export default validateArticleBlocks;