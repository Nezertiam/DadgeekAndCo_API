const jwt = require("jsonwebtoken");
const config = require("config");

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