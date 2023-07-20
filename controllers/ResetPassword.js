const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//resetPasswordTokenGenerator OR resetPassLinkGenerator
exports.resetPasswordToken = async (req, res) => {
    try {
        //Get email from the req body
        const email = req.body.email;
        //find the user with this email
        const user = await User.findOne({ email });
        //Check if user with this mail id is present or not
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User with this email id is not registered.",
            });
        }
        //generate a token
        const token = crypto.randomUUID();
        //Update user by sending this expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email: email },
            {
                token: token,
                expiryTime: Date.now() + 10 * 60 * 1000,
            },
            { new: true }
        );
        //Create a url for resetting password
        const url = `http://localhost:3000/update-password/${token}`;
        const mailBody = `<p>Click here to reset your password: ${url}</p>`;
        await mailSender(email, "Password reset link", mailBody);
        return res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email.",
            url: url,
        });
    } catch (err) {
        console.log("Error in tokenizing reset password URL: ", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong in tokenizing reset password URL",
            error: err.message,
        });
    }
};

//reset Password

exports.resetPassword = async (req, res) => {
    try {
        //fetch data from req.body
        const { token, password, confirmPassword } = req.body;

        //Validation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and Confirm Password do not match",
            });
        }

        //get user details via token
        const userDetails = await User.findOne({ token: token });
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "Invalid token",
            });
        }
        if (userDetails.expiryTime < Date.now()) {
            return res.status(400).json({
                success: false,
                message:
                    "Link for resetting password is expired, please regenrate the link",
            });
        }

        //Hashing new password
        const hashedPassword = await bcrypt.hash(password, 10);

        //TODO: check if userDetails works instead of finding again with User.findOneAndUpdate
        //Password Update
        await User.findOneAndUpdate(
            { token: token },
            { password: hashedPassword },
            { new: true }
        );

        //Send success response
        return res.status(200).json({
            success: true,
            message: "Password has been updated successfully",
        });
    } catch (err) {
        console.log("Error in resetting password: ", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong in resetting password",
            error: err.message,
        });
    }
};
