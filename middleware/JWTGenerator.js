const jwt = require("jsonwebtoken");

module.exports = async (payload) => {
    jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: config.get("jwtExp") },
        (err, token) => {
            if (err) {
                throw err;
            } else {
                return token;
            }
        }
    )
}