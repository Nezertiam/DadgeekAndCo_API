// Librairies


// Models
import User from "../models/User.js";

// Services
import response from "../services/response.js";



// @Route GET api/admin/ban/:id/:time
export const banUser = async (req, res) => {


    // STEP 1 : GRANT PERMISSION
    if (!req.user.isGranted("ROLE_ADMIN")) return res.status(401).json({ ...response.errors.unauthorized() });

    // STEP 2 : VALIDATE ID AND TIME and FIND USER AND BAN HIM
    if (req.params.id.length !== 12 && req.params.id.length !== 24) return res.status(400).json({ ...response.errors.invalidId() });
    const seconds = parseInt(req.params.time);
    if (typeof seconds === "NaN") return res.status(400).json({ ...response.builder(400, "Invalid time, must be a number") });
    const banEnd = new Date();
    banEnd.setSeconds(banEnd)
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ ...response.errors.notFound("User") });



    // STEP 3 : SAVE IT

}