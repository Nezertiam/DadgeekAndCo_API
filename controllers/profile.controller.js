import Profile from "../models/Profile.js";


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
            ["name", "bio", "avatar", "twitch", "twitter", "instagram", "tiktok", "youtube"]
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
            return res.json(profile);
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

    const { bio, twitch, twitter, instagram, tiktok, youtube } = req.body;
    const profileFields = {};

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

        return res.status(200).json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error." })
    }
}