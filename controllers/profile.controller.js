import Profile from "../models/Profile.js";

export const getMyProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate("user", ["name"]);
        if (!profile) {
            return res.status(400).json({ message: "There is no profile for this user" })
        } else {
            return res.json(profile);
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error." })
    }
}