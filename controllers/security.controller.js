const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const config = require("config");
const argon2 = require("argon2");
const JWTGenerator = require("../middleware/JWTGenerator");

const User = require("../models/User");


// Routes

// @Route /api/users/register
/**
 * Register function for the API
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.register = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get the body content and destructure it
    const { name, email, password } = req.body;

    // Try create and save the new user
    try {
        // See if user exists, if yes, return an error
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ message: "User already exists." }] });
        }

        // Hydratation of the new user object 
        user = new User({
            name,
            email,
            password
        })

        // Hash password and set the hash as the user's password
        user.password = await argon2.hash(password);

        // Save the user
        await user.save();

        // Set the user id in the payload of the JWT
        const payload = {
            user: {
                id: user.id // can use .id instead of ._id thanks to mongoose
            }
        }

        // Sign JSON and returns it in the callback
        const token = await JWTGenerator(payload);
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error.");
    }
}


// @Route /api/users/auth
/**
 * Authentication function using JWT
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.authentication = async (req, res) => {
    // First, validate body content or return an error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get email and password from the body content
    const { email, password } = req.body;

    // Try authenticate the user
    try {
        // See if the email exists, else send an error
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
        }

        // Test if the passwords matches, else return an error
        const isMatch = await argon2.verify(user.password, password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
        }

        // Set payload with user's id
        const payload = {
            user: {
                id: user.id // can use .id instead of ._id thanks to mongoose
            }
        }

        // Return JsonWebToken
        const token = await JWTGenerator(payload);
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
}