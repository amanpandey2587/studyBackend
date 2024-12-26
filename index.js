const express = require("express");
const app = express();
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoutes = require("./routes/Contact");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000 || 3432;

if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
    console.error("Missing Cloudinary configuration in environment variables.");
    process.exit(1); // Exit the process if any configuration is missing
}

database.connect();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
}));
app.use(express.urlencoded({ extended: true }));

cloudinaryConnect();

// Routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoutes);

app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Your server is up and running"
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
server.timeout = 120000; // Set a timeout of 120 seconds if needed
