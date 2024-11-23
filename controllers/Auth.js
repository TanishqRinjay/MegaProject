const User = require("../models/User");
const Profile = require("../models/Profile");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const jwt = require("jsonwebtoken");
const { log } = require("../utils/logger");
require("dotenv").config();

//sendOTP
exports.sendOTP = async (req, res) => {
    try {
        //Fetch email from the req body
        const { email } = req.body;
        //Check if user already exists
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({ error: "User already exists" });
        }
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("OTP generated: ", otp);

        //Check if OTP is unique or not
        const result = await OTP.findOne({ otp: otp });
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabet: false,
                lowerCaseAlphabet: false,
                specialChars: false,
            });
            console.log("OTP generated: ", otp);
            result = await OTP.findOne({ otp: otp });
        }

        const otpPayload = { email, otp };

        //Create an OTP for entry in DB
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP created: ", otpBody);

        //return response for successful creation
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });
        //last
        //last
    } catch (err) {
        console.log("Error in sending OTP: ", err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

//SignUp

exports.signUp = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        } = req.body;

        //Validate data
        if (
            !firstName ||
            !lastName ||
            !email ||
            !password ||
            !confirmPassword ||
            !otp
        ) {
            return res.status(403).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        //Check both passwords
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match, try again",
            });
        }
        //check if User already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email ID already exists",
            });
        }

        //checking for most recent OTP
        const recentOTP = await OTP.find({ email })
            .sort({ createdAt: -1 })
            .limit(1);
        console.log(recentOTP);

        //Validate OTP
        if (recentOTP.length == 0) {
            //OTP not found
            return res.status(400).json({
                success: false,
                message: "OTP not found",
            });
        } else if (otp !== recentOTP[0].otp) {
            //Invalid OTP
            return res.status(400).json({
                success: false,
                message: `Invalid OTP`,
            });
        }

        //Password hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        //Create entry in DB

        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null,
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            contactNumber,
            additionalDetails: profileDetails,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
        });

        //Return success response
        return res.status(200).json({
            success: true,
            message: "User created successfully",
        });
    } catch (err) {
        console.log("Error in signing up: ", err);
        res.status(500).json({
            success: false,
            message: "Error in signing up",
        });
    }
};

//Login
exports.login = async (req, res) => {
    try {
        log("Login process started", "/api/v1/auth/login");

        const { email, password } = req.body;

        // Data fields validation
        if (!email || !password) {
            log(
                "Login failed: missing email or password",
                "/api/v1/auth/login"
            );
            return res.status(403).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        // Check if user's email is registered
        const user = await User.findOne({ email })
            .populate("additionalDetails")
            .exec();

        if (!user) {
            log(
                `Login failed: user not registered with email ${email}`,
                "/api/v1/auth/login"
            );
            return res.status(401).json({
                success: false,
                message: "User not registered, please Sign Up!",
            });
        }

        // Comparing the passwords
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "30d",
            });

            user.token = token;
            user.password = undefined;

            // Create cookie and send response
            const options = {
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            };

            log(
                `Login successful for user with email ${email}`,
                "/api/v1/auth/login"
            );

            res.cookie("token", token, options).status(200).json({
                success: true,
                message: "Logged in successfully",
                token,
                user,
            });
        } else {
            log(
                `Login failed: invalid credentials for email ${email}`,
                "/api/v1/auth/login"
            );
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
    } catch (err) {
        log(`Error during login process: ${err.message}`, "/api/v1/auth/login");
        res.status(500).json({
            success: false,
            message: "Error in logging in",
        });
    }
};

//Change Password
exports.changePassword = async (req, res) => {
    try {
        // Get user data from req.user
        const userDetails = await User.findById(req.user.id);

        // Get old password, new password, and confirm new password from req.body
        const { currentPassword, newPassword } = req.body;

        // Validate old password
        const isPasswordMatch = await bcrypt.compare(
            currentPassword,
            userDetails.password
        );
        if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res
                .status(401)
                .json({ success: false, message: "The password is incorrect" });
        }

        // Update password
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUserDetails = await User.findByIdAndUpdate(
            req.user.id,
            { password: encryptedPassword },
            { new: true }
        );

        // Send notification email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                "Password changed",
                passwordUpdated(
                    updatedUserDetails.email,
                    `${updatedUserDetails.firstName} ${updatedUserDetails.lastName},`
                )
            );
            console.log("Email sent successfully:", emailResponse.response);
        } catch (error) {
            // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
            console.error("Error occurred while sending email:", error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }

        // Return success response
        return res
            .status(200)
            .json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while updating password:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while updating password",
            error: error.message,
        });
    }
};
