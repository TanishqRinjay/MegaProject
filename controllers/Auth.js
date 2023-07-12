const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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
            upperCaseAlphabet: false,
            lowerCaseAlphabet: false,
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
        } else if (otp !== recentOTP.otp) {
            //Invalid OTP
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        //Password hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        //Create entry in DB

        const profileDetails = await profile.create({
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
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
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
        const { email, password } = req.body;
        //data fields validation
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "Please fill all the fields",
            });
        }
        //Check if user's email is registered
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not registered, please Sign Up!",
            });
        }

        //Comparing the passwords
        if (await bcrypt.compare(user.password, password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "2h",
            });
            user.token = token;
            user.password = undefined;

            //Create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            };
            res.cookie("token", token, options).status(200).json({
                success: true,
                message: "Logged in successfully",
                token,
                user,
            });
        } else {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        //last
        //last
    } catch (err) {
        console.log("Error in logging in: ", err);
        res.status(500).json({
            success: false,
            message: "Error in logging in",
        });
    }
};

//Change Password
const changePassword = async (req, res) => {
    const {} = req.body;

}