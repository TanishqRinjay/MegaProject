const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const { response } = require("express");

//auth
exports.auth = async (req, res, next) => {
    try {
        //extract token
        const token =
            req.body.token ||
            req.cookies.token ||
            req.header("Authorization").replace("Bearer", "");
        //if token is missing
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token found",
            });
        }
        //Token verification
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
            console.log(req.user.accountType);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Something went wrong while validating token",
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
        next()
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "User role cannot be verified",
        });
    }
};
