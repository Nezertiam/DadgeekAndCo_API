import mongoose from "mongoose";
import config from "config";

const mongoURI = config.get("mongoURI");


/**
 * This function needs "mongoURI" parameter to be set in default.json in order to connect the app to MongoDB.
 */
const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true
        });
        console.log("MongoDB connected.");
    } catch (err) {
        console.error(err.message);
        // Exit process with failure
        process.exit(1);
    }
}

export default connectDB;