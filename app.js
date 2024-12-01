const express = require("express");

const app = express();
const { asyncLocalStorage } = require("./middlewares/asyncLocalStorage");  // Import it here

const adminRoutes = require("./routes/Admin");
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const commonRoutes = require("./routes/Common");
const openaiRoutes = require("./routes/OpenAI");
const bodyParser = require("body-parser");
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


// Middleware to initialize AsyncLocalStorage context **after** authentication
app.use((req, res, next) => {
    const correlationId = Date.now().toString();
    const userId = req.user ? req.user.id : "Guest";
    
    asyncLocalStorage.run({ correlationId, userId }, () => {
        next();
    });
});

// Routes
app.use("/api/v1/admin", adminRoutes);
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

app.get("/test-error", (req, res, next) => {
    try {
        // Deliberately throw an error
        throw new Error("This is a test error");
    } catch (error) {
        next(error);
    }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Send a generic error response
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: err.message,
    });
});

app.listen(PORT, (req, res) => {
    console.log(`App is running on port no. ${PORT}`);
});
