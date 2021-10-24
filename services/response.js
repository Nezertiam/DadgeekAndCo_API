import { default as errors } from "./messages/errors.responses.js";
import { default as success } from "./messages/success.responses.js";



const codes = {
    200: "OK",
    201: "Created",

    400: "Bad Request",
    401: "Unauthorized"
}



/**
 * @param {String | Number} code 
 * @param {String} message
 * 
 * @returns "Builds the response with code, status and message"
 */
const builder = (code, message) => {

    const status = Object.getOwnPropertyDescriptor(codes, code).value;

    if (typeof code !== "number") code = parseInt(code);
    if (!message.slice(-1) === ".") message += ".";

    return {
        code: parseInt(code),
        status: status,
        message: message
    }
}


const response = {
    errors: errors,
    success: success,
    builder: builder
}

export default response;