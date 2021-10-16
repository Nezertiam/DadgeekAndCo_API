import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    bio: {
        type: String
    },
    avatar: {
        type: String
    },
    twitch: {
        type: String
    },
    twitter: {
        type: String
    },
    instagram: {
        type: String
    },
    tiktok: {
        type: String
    },
    youtube: {
        type: String
    }
});

const Profile = mongoose.model("Profile", ProfileSchema);
export default Profile;