import express from "express";
import connectDB from "./config/db.js";
import securityRoutes from "./routes/security.routes.js"
import profileRoutes from "./routes/profile.routes.js";

const app = express();

// Connect database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.get("/", (req, res) => res.json({ message: "API Running" }))

// Define routes
app.use("/api/security", securityRoutes);
app.use("/api/profile", profileRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));