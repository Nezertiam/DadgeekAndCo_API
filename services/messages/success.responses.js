
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
 * @returns "200 - (params.resource) found!"
 */
const found = (resource) => {
    let message = (resource) ? `${uppercaseFirst(resource)} found!` : "Resource found!";

    return {
        code: 200,
        status: "OK",
        message: message
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @returns "200 - (params.resource) edited!"
 */
const edited = (resource) => {
    let message = (resource) ? `${uppercaseFirst(resource)} edited!` : "Resource edited!";

    return {
        code: 200,
        status: "OK",
        message: message
    }
}

/**
 * @param {String} resource (optionnal)
 * 
 * @returns "200 - (params.resource) deleted!"
 */
const deleted = (resource) => {
    let message = (resource) ? `${uppercaseFirst(resource)} deleted!` : "Resource deleted!";

    return {
        code: 200,
        status: "OK",
        message: message
    }
}



/**
 * @param {String} resource (optionnal)
 * 
 * @returns "201 - (params.resource) created!"
 */
const created = (resource) => {
    let message = (resource) ? `${uppercaseFirst(resource)} created!` : "Resource created!"

    return {
        code: 201,
        status: "OK",
        message: message
    }
}





const success = {
    created: created,
    found: found,
    edited: edited,
    deleted: deleted,
}
export default success;