const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const commonRoutes = require("./routes/Common");
const openaiRoutes = require("./routes/OpenAI");
const bodyParser = require('body-parser');
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

//Database connect
database.connect();

//middlewares

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

//CLoudinary connection
cloudinaryConnect();

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", commonRoutes);
app.use("/api/v1/openai", openaiRoutes);

//def route
app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Your server is up and running",
    });
});

app.listen(PORT, (req, res) => {
    console.log(`App is running on port no. ${PORT}`);
});
