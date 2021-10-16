import { validationResult } from "express-validator";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "config";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

// Routes

// @Route /api/security/register
/**
 * Register function for the API
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const register = async (req, res) => {
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

        // Create a new profile for this user and save it
        const profile = new Profile({ user: user.id })
        await profile.save();

        // Set the user id in the payload of the JWT
        const payload = {
            user: {
                id: user.id // can use .id instead of ._id thanks to mongoose
            }
        }

        // Sign JSON and returns it in the callback
        jwt.sign(
            payload,
            config.get("jwtSecret"),
            { expiresIn: config.get("jwtExp") },
            (err, token) => {
                if (err) {
                    throw err;
                } else {
                    res.status(201).json({ token })
                }
            }
        )

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error.");
    }
}


// @Route /api/security/auth
/**
 * Authentication function using JWT
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const authentication = async (req, res) => {
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
        jwt.sign(
            payload,
            config.get("jwtSecret"),
            { expiresIn: config.get("jwtExp") },
            (err, token) => {
                if (err) {
                    throw err;
                } else {
                    res.status(200).json({ token })
                }
            }
        )

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
}