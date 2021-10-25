// Librairies


// Models
import User from "../models/User.js";

// Services
import response from "../services/response.js";



// @Route GET api/admin/ban/:id/:minutes
export const banUser = async (req, res) => {

    function addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }

    // STEP 1 : GRANT PERMISSION
    if (!req.user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.errors.unauthorized() });

    // STEP 2 : VALIDATE ID AND TIME and FIND USER TO BAN AND BAN HIM
    if (req.params.id.length !== 12 && req.params.id.length !== 24) return res.status(400).json({ ...response.errors.invalidId() });
    const seconds = parseInt(req.params.minutes);
    if (typeof seconds === "NaN") return res.status(400).json({ ...response.builder(400, "Invalid time, must be a number") });
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ ...response.errors.notFound("User") });

    const banTimes = user.banTimes + 1;
    let banEnd;
    if (banTimes >= 3) {
        banEnd = new Date(99999999999999);
    } else {
        banEnd = addMinutes(new Date, req.params.minutes);
    }
    user.banEnd = banEnd;
    user.banTimes = banTimes;

    // STEP 3 : SAVE IT
    try {
        user.save();
        return res.status(200).json({ ...response.errors.bannedUser() });
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({ ...response.errors.server() })
    }

}