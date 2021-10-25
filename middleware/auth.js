import jwt from "jsonwebtoken";
import config from "config";

import User from "../models/User.js";

export default async function (req, res, next) {
    // get token from header
    const token = req.header("x-auth-token");

    const response = {
        code: 401,
        status: "Unauthorized",
        message: undefined
    }

    // Check if no token
    if (!token) {
        response.message = "No token, access denied."
        return res.status(401).json({ ...response });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, config.get("jwtSecret"));
        const user = await User.findOne({ _id: decoded.user.id })
        if (user.isBanned()) {
            response.message = "Banned user.";
            return res.status(401).json({ ...response });
        }
        req.user = user;
        next();
    } catch (err) {
        response.message = "Invalid token."
        res.status(401).json({ ...response });
    }
}