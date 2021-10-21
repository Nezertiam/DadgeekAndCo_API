
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
    return (resource) ? `200 - ${uppercaseFirst(resource)} found!` : "200 - Found!"
}

/**
 * @param {String} resource (optionnal)
 * 
 * @returns "200 - (params.resource) edited!"
 */
const edited = (resource) => {
    return (resource) ? `200 - ${uppercaseFirst(resource)} edited!` : "200 - Edited!"
}

/**
 * @param {String} resource (optionnal)
 * 
 * @returns "200 - (params.resource) deleted!"
 */
const deleted = (resource) => {
    return (resource) ? `200 - ${uppercaseFirst(resource)} deleted!` : "200 - Deleted!"
}



/**
 * @param {String} resource (optionnal)
 * 
 * @returns "201 - (params.resource) created!"
 */
const created = (resource) => {
    return (resource) ? `201 - ${uppercaseFirst(resource)} created!` : "201 - Created!"
}





const success = {
    created: created,
    found: found,
    edited: edited,
    deleted: deleted,
}
export default success;