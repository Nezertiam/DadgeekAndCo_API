import { validationResult } from "express-validator";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import config from "config";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import uuid from "uuid/v4.js";
import isGranted from "../services/isGranted.js";

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
                id: user.id, // can use .id instead of ._id thanks to mongoose
                roles: user.roles
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
                    return res.status(201).json({ message: "User created successfully", data: token })
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
                id: user.id, // can use .id instead of ._id thanks to mongoose
                roles: user.roles
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
    if (isGranted("ROLE_ADMIN", user)) return res.status(400).json({ message: "This account can't be deleted" })

    // Generate fake mail
    const uid = uuid();
    const date = new Date();
    const email = date.toISOString().replace(/:/g, "-") + uid;

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