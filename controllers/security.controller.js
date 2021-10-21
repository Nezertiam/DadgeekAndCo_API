import { validationResult } from "express-validator";
import sanitizer from "sanitizer";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import uuid from "uuid/v4.js";
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
    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    errors = []    // reset errors

    // Check types
    if (typeof req.body.name !== 'string') errors.push({ message: "Bad syntax on name property" });
    if (typeof req.body.email !== 'string') errors.push({ message: "Bad syntax on email property" });
    if (typeof req.body.password !== 'string') errors.push({ message: "Bad syntax on password property" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });


    // Get body content
    const name = sanitizer.sanitize(req.body.name)
    if (name !== req.body.name) errors.push({ message: "Name contains forbidden characters" });
    const email = sanitizer.sanitize(req.body.email)
    if (email !== req.body.email) errors.push({ message: "Email contains forbidden characters" });
    const password = sanitizer.sanitize(req.body.password)
    if (password !== req.body.password) errors.push({ message: "Password contains forbidden characters" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });


    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
        return res.status(400).json({ message: "User already exists." });
    }

    // Hydratation of the new user object 
    user = new User({
        name,
        email,
        password
    })

    // Hash password and set the hash as the user's password
    let hash = await argon2.hash(password);
    user.password = hash;

    // Create a new profile for this user and save it
    const profile = new Profile({ user: user.id })

    try {
        // Save the user and profile
        await user.save();
        await profile.save();

        return res.status(201).json({ message: "Hey you, you're finally awake!" })
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error" });
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
    let errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    errors = []    // reset errors

    // Check types
    if (typeof req.body.email !== 'string') errors.push({ message: "Bad syntax on email property" });
    if (typeof req.body.password !== 'string') errors.push({ message: "Bad syntax on password property" });
    if (errors.length > 0) return res.status(400).json({ errors: errors });

    // Get body content
    const email = sanitizer.sanitize(req.body.email)
    if (email !== req.body.email) return res.status(400).json({ message: "Email contains forbidden characters" });
    const password = sanitizer.sanitize(req.body.password)
    if (password !== req.body.password) return res.status(400).json({ message: "Password contains forbidden characters" });

    // Check if user exist
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Test if the passwords matches, else return an error
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Set payload with user's id
    const payload = {
        user: {
            id: user.id
        }
    }

    try {
        // Return JsonWebToken
        jwt.sign(
            payload,
            config.get("jwtSecret"),
            { expiresIn: config.get("jwtExp") },
            (err, token) => {
                if (err) {
                    throw err;
                } else {
                    return res.status(200).json({ message: "Wait, I know you !", data: token })
                }
            }
        )
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
}


// @Route DELETE /api/security/delete
/**
 * "Delete" user's account and profile by overwriting personal data by other strings
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const deleteMe = async (req, res) => {

    // Get user
    const user = await User.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Admin can't delete himself
    if (user.isGranted("ROLE_ADMIN")) return res.status(400).json({ message: "This account can't be deleted" })

    // Generate fake mail
    const uid = uuid();
    const date = new Date();
    const email = date.toISOString().replace(/:/g, "-") + uid + "@maildeleted.com";

    // Set data
    const userFakeData = {
        name: "[Profile deleted]",
        email: email,
        password: uuid(),
        role: []
    }

    // Save data
    try {
        const user = await User.findByIdAndUpdate(
            { _id: req.user.id },
            { $set: userFakeData },
            { new: true }
        )
        await Profile.findOneAndDelete({ user: req.user.id })
        return res.status(200).json({ message: "Account and profile successfully deleted", user: user })
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ message: "Server error." })
    }
}