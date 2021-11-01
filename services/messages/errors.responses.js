

/**
 * Capitalise first letter and others are in lowercase
 * 
 * @param {String} str
 */
const uppercaseFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}


/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - Bad syntax (on params.resource property)." 
 */
const badSyntax = (resource = "") => {
    let message = "";
    if (resource && typeof resource === "string") {
        message += `Bad syntax on ${resource.toLowerCase() + " "}property.`
    } else {
        message += "Bad syntax."
    }

    return {
        code: 400,
        status: "Bad Request",
        message: message,
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - Property (params.resource) missing." 
 */
const propMissing = (resource) => {
    let message = "";
    if (resource && typeof resource === "string") {
        message += `Property ${resource.toLowerCase() + " "}missing.`
    } else {
        message += "Property missing."
    }

    return {
        code: 400,
        status: "Bad Request",
        message: message
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - (params.ressource contains) invalid characters." 
 */
const invalidChars = (resource) => {
    let message = "";
    if (resource && typeof resource === "string") {
        message += `${uppercaseFirst(resource)} contains invalid characters.`
    } else {
        message += "Invalid characters."
    }

    return {
        code: 400,
        status: "Bad Request",
        message: message
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - (params.ressource) cannot be empty." 
 */
const empty = (resource) => {
    let message = "";
    if (resource && typeof resource === "string") {
        message += `${uppercase(resource)} cannot be empty.`
    } else {
        message += "Cannot be empty."
    }

    return {
        code: 400,
        status: "Bad Request",
        message: message
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - IDs must be a string of 12 or 24 characters." 
 */
const invalidId = (resource) => {
    let message = "IDs must be a string of 12 or 24 characters."

    return {
        code: 400,
        status: "Bad Request",
        message: message
    }
}





/**
 * @Return "401 - Invalid token" 
 */
const invalidToken = () => {
    let message = "Invalid token.";

    return {
        code: 401,
        status: "Unauthorized",
        message: message
    }
}

/**
 * @Return "401 - Unauthorized user." 
 */
const unauthorized = () => {
    let message = "Unauthorized user.";

    return {
        code: 401,
        status: "Unauthorized",
        message: message
    }
}


/**
 * @Return "401 - Banned user." 
 */
const bannedUser = () => {
    let message = "Banned user.";

    return {
        code: 401,
        status: "Unauthorized",
        message: message
    }
}





/**
 * @param {String} resource (optionnal)
 * 
 * @Return "404 - params.resource not found."
 */
const notFound = (resource) => {
    let message = "";
    if (resource && typeof resource === "string") {
        message += `${uppercaseFirst(resource)} not found.`
    } else {
        message += "Not found."
    }

    return {
        code: 404,
        status: "Not Found",
        message: message
    }
}





/**
 * @param {String} resource (optionnal) The resource failed to create.
 * @param {String} resource2 (optionnal) The cause resource involving the fail.
 * 
 * @Return "500 - (params.ressource) creation failed (because of invalid params.resource2)." 
 */
const creationFailed = (resource, resource2) => {

    let str = "";

    str += (resource) ? `${str} ${uppercaseFirst(resource)} creation failed` : `${str} Creation failed.`;
    str += (resource2) ? `${str} because of invalid ${resource2}.` : `${str}.`

    return {
        code: 500,
        status: "Internal Server Error",
        message: message
    }
}


const server = () => {

    let message = "Internal Server Error";

    return {
        code: 500,
        status: "Internal Server Error",
        message: message
    }
}



const errors = {
    notFound: notFound,
    badSyntax: badSyntax,
    propMissing: propMissing,
    invalidToken: invalidToken,
    unauthorized: unauthorized,
    invalidChars: invalidChars,
    empty: empty,
    creationFailed: creationFailed,
    server: server,
    invalidId: invalidId,
    bannedUser: bannedUser
}
export default errors;