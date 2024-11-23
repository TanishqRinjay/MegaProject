const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const { asyncLocalStorage } = require("./asyncLocalStorage");
const { log } = require("../utils/logger");

//auth
exports.auth = async (req, res, next) => {
    try {
        //extract token
        const token =
            req.body.token ||
            req.cookies.token ||
            req.header("Authorization")?.replace("Bearer ", "");
        //if token is missing
        if (!token) {
            log("failed authentication (no token)", req.originalUrl);
            return res.status(401).json({
                success: false,
                message: "No token found",
            });
        }
        //Token verification
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;

            // Update the AsyncLocalStorage store with the user ID
            const store = asyncLocalStorage.getStore();
            if (store) {
                store.userId = req.user.id;
            }
            log(`authenticated user: ${decode.id}`, req.originalUrl);
            // console.log(req.user.accountType);
        } catch (err) {
            log("failed authentication (invalid token)", req.originalUrl);
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        next();
    } catch (err) {
        log(`authentication error: ${err.message}`, req.originalUrl);
        return res.status(401).json({
            success: false,
            message: "Something went wrong while validating token",
            error: err.message,
        });
    }
};

//isStudent
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for students",
            });
        }
        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "User role cannot be verified",
        });
    }
};

//isInstructor
exports.isInstructor = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for instructor",
            });
        }
        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "User role cannot be verified",
        });
    }
};

//isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "This is a protected route for admin",
            });
        }
        next();
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "User role cannot be verified",
        });
    }
};
