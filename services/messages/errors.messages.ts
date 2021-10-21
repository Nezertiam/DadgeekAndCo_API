

/**
 * Capitalise first letter and others are in lowercase
 */
const uppercaseFirst = (str: String) => {
    return str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}


/**
 * @Return "400 - Bad syntax (on params.resource property)." 
 */
const badSyntax = (resource: String = "") => {
    if (resource) {
        return `400 - Bad syntax on ${resource.toLowerCase() + " "} property.`
    } else {
        return "400 - Bad syntax."
    }
}

/**
 * @Return "400 - Property (params.resource) missing.." 
 */
const propMissing = (resource: String = "") => {
    if (resource) {
        return `400 - Property ${resource.toLowerCase()} missing.`
    } else {
        return "400 - Property missing."
    }
}

/**
 * @Return "404 - params.resource not found."
 */
const notFound = (resource: String = "Resource") => {
    return `404 - ${uppercaseFirst(resource)} not found.`
}




const errors = {
    notFound: notFound,
    badSyntax: badSyntax
}
export default errors;