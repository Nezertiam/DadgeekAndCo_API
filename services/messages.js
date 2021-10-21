import { default as errors } from "./messages/errors.messages.js";
import { default as success } from "./messages/success.messages.js";

/**
 * @param {String | Number} code 
 * @param {String} message
 * 
 * @returns "params.code - params.message"
 */
const builder = (code, message) => {
    return `${code} - ${message}`
}

const messages = {
    errors: errors,
    success: success,
    builder: builder
}

export default messages;