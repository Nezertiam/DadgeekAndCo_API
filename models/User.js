import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true
        },
        roles: {
            type: [String],
            default: ["ROLE_USER"]
        },
        uniqueString: {
            type: String
        },
        exp: {
            type: Date
        },
        isValid: {
            type: Boolean,
            required: true,
            default: false
        },
        banEnd: {
            type: Date,
            default: undefined
        },
        banTimes: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

/**
 * Check if the user has the specified role
 * 
 * @param {String} role The role you want to check
 */
UserSchema.methods.isGranted = function (role) {
    if (typeof role !== "string") throw "Not a string";

    if (this.roles.includes("ROLE_ADMIN") || this.roles.includes(role)) {
        return true;
    } else {
        return false;
    }
}


/**
 * Check if the user is banned
 */
UserSchema.methods.isBanned = function () {

    if (this.banEnd && new Date(this.banEnd) > new Date()) {
        return true;
    } else {
        return false;
    }
}

const User = mongoose.model("user", UserSchema);
export default User;