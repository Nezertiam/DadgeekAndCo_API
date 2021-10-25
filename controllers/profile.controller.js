// Librairies
import sanitizer from "sanitizer";

// Models
import Profile from "../models/Profile.js";
import User from "../models/User.js";

// Services
import response from "../services/response.js";


// @Route /api/profile/me
/**
 * Get the user's profile via user ID in JWT
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const getMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate("user", ["name", "email", "date"]);
        if (!profile) {
            return res.status(404).json({ ...response.builder(404, "There is no profile for this user.") })
        } else {
            return res.json({ ...response.success.found("profile"), data: profile });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ ...response.errors.server() })
    }
}

// @Route /api/profile/user/:user_id
/**
 * Get the user's profile via user ID
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const getProfile = async (req, res) => {

    // Check id
    if (req.params.user_id.length !== 12 && req.params.user_id.length !== 24) return res.status(400).json({ ...response.errors.invalidId() })

    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate("user", ["name"]);
        if (!profile) {
            return res.status(404).json({ ...response.builder(404, "There is no profile for this user.") })
        } else {
            return res.json({ ...response.success.found("profile"), data: profile });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ ...response.errors.server() })
    }
}


// @Route /api/profile/edit
/**
 * Edit user's profile via user ID in JWT
 *
 * @param {*} req
 * @param {*} res
 */
export const editMyProfile = async (req, res) => {

    // if id
    if (req.params.id && (req.params.id.length !== 12 && req.params.id.length !== 24)) return res.status(400).json({ ...response.errors.invalidId() })

    // Grant permission if other user
    let user;
    if (req.params.id) user = User.findOne({ _id: req.params.id });
    if (req.params.id && !user) return res.status(401).json({ ...response.errors.invalidToken() });
    if (req.params.id && !user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.errors.unauthorized() });


    const profileFields = {};

    // Sanitize fields
    if (req.body.bio && typeof req.body.bio === "string") {
        bio = sanitizer.sanitize(req.body.bio)
        if (bio === req.body.bio) profileFields.bio = bio;
    };
    if (req.body.twitch && typeof req.body.twitch === "string") {
        twitch = sanitizer.sanitize(req.body.twitch)
        if (twitch === req.body.twitch) profileFields.twitch = twitch;
    };
    if (req.body.twitter && typeof req.body.twitter === "string") {
        twitter = sanitizer.sanitize(req.body.twitter)
        if (twitter === req.body.twitter) profileFields.twitter = twitter;
    };
    if (req.body.instagram && typeof req.body.instagram === "string") {
        instagram = sanitizer.sanitize(req.body.instagram)
        if (instagram === req.body.instagram) profileFields.instagram = instagram;
    };
    if (req.body.tiktok && typeof req.body.tiktok === "string") {
        tiktok = sanitizer.sanitize(req.body.tiktok)
        if (tiktok === req.body.tiktok) profileFields.tiktok = tiktok;
    };
    if (req.body.youtube && typeof req.body.youtube === "string") {
        youtube = sanitizer.sanitize(req.body.youtube)
        if (youtube === req.body.youtube) profileFields.youtube = youtube;
    };

    // Set data
    if (bio) profileFields.bio = bio;
    if (twitch) profileFields.twitch = twitch;
    if (twitter) profileFields.twitter = twitter;
    if (instagram) profileFields.instagram = instagram;
    if (tiktok) profileFields.tiktok = tiktok;
    if (youtube) profileFields.youtube = youtube;

    const id = (req.params.id) ? req.params.id : req.user.id;

    try {
        const profile = await Profile.findOneAndUpdate(
            { user: id },
            { $set: profileFields },
            { new: true }
        );
        return res.status(200).json({ ...response.success.edited("Profile"), data: profile });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ ...response.errors.server() })
    }
}