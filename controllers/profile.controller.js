import Profile from "../models/Profile.js";
import sanitizer from "sanitizer";


// @Route /api/profile/me
/**
 * Get the user's profile via user ID in JWT
 * 
 * @param {*} req 
 * @param {*} res 
 */
export const getMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate("user",
            ["name", "email", "date", "bio", "avatar", "twitch", "twitter", "instagram", "tiktok", "youtube"]
        );
        if (!profile) {
            return res.status(400).json({ message: "There is no profile for this user." })
        } else {
            return res.json(profile);
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error." })
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
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate("user",
            ["name", "bio", "avatar", "twitch", "twitter", "instagram", "tiktok", "youtube"]
        );
        if (!profile) {
            return res.status(400).json({ message: "There is no profile for this user." })
        } else {
            return res.json({ data: profile });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error." })
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

    try {
        const profile = await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
        );
        return res.status(200).json({ data: profile });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error." })
    }
}