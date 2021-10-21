

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
    if (resource && typeof resource === "string") {
        return `400 - Bad syntax on ${resource.toLowerCase() + " "}property.`
    } else {
        return "400 - Bad syntax."
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - Property (params.resource) missing." 
 */
const propMissing = (resource) => {
    if (resource && typeof resource === "string") {
        return `400 - Property ${resource.toLowerCase() + " "}missing.`
    } else {
        return "400 - Property missing."
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - (params.ressource contains) invalid characters." 
 */
const invalidChars = (resource) => {
    if (resource && typeof resource === "string") {
        return `400 - ${uppercase(resource)} contains invalid characters.`
    } else {
        return "400 - Invalid characters."
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @Return "400 - (params.ressource) cannot be empty." 
 */
const empty = (resource) => {
    if (resource && typeof resource === "string") {
        return `400 - ${uppercase(resource)} cannot be empty.`
    } else {
        return "400 - Cannot be empty."
    }
}





/**
 * @Return "401 - Invalid token" 
 */
const invalidToken = () => {
    return "401 - Invalid token";
}

/**
 * @Return "401 - Unauthorized user." 
 */
const unauthorized = () => {
    return "401 - Unauthorized user.";
}





/**
 * @param {String} resource (optionnal)
 * 
 * @Return "404 - params.resource not found."
 */
const notFound = (resource) => {
    if (resource && typeof resource === "string") {
        return `404 - ${uppercaseFirst(resource)} not found.`
    } else {
        return "404 - Not found."
    }
}





/**
 * @param {String} resource (optionnal) The resource failed to create.
 * @param {String} resource2 (optionnal) The cause resource involving the fail.
 * 
 * @Return "500 - (params.ressource) creation failed (because of invalid params.resource2)." 
 */
const creationFailed = (resource, resource2) => {

    let str = "500 -";

    str = (resource && typeof resource === "string") ? `${str} ${resource.toLowerCase()} creation failed` : `${str} Creation failed.`;
    str = (resource2 && typeof resource2 === "string") ? `${str} because of invalid ${resource2}.` : `${str}.`

    return str;
}


const server = () => {
    return "500 - Internal server error."
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
    server: server
}
export default errors;