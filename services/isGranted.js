
/**
 * Check if the user have the role asked
 * 
 * @param {String} role The role you wish to check
 * @param {Object} user The user you wish to control
 */
const isGranted = (role, user) => {
    if (!user.roles.includes("ROLE_ADMIN") && !user.roles.includes(role)) {
        return false;
    } else {
        return true;
    }
}

export default isGranted;