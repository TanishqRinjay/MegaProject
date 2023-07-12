const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");

//Updating Profile info
exports.updateProfile = async (req, res) => {
    try {
        //Fetch data
        const {
            gender,
            dateOfBirth = "",
            about = "",
            contactNumber,
        } = req.body;

        //Fetch User Id (coming from middleware, where we decoded JWT token)
        const id = req.user.id;

        //Validate data
        if (!gender || !contactNumber || !id) {
            return res.status(400).json({
                success: false,
                message: "Please fill necessary fields",
            });
        }

        //Retrieving Profile details by retrieving User details first
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);

        //
        //TODO: check code below if it works
        //Retrieving profile id from user details using populate
        //const profileDetails = await User.findById(id).populate("additionalDetails");
        //

        //Updating profile details
        //1. First Method
        // const updatedProfile = await Profile.findByIdAndUpdate(profileId, {
        //     gender,
        //     dateOfBirth,
        //     about,
        //     contactNumber
        // })
        //2. Second Method
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        await profileDetails.save();

        //Success response
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to create Profile, internal error",
            error: err.message,
        });
    }
};

//Delete Account
exports.updateProfile = async (req, res) => {
    try {
        //Fetch data
        const id = req.user.id;

        //Validate Id
        const userDetails = await User.findById(id);
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "Invalid User Id",
            });
        }

        //Retrieving Profile Id by User Id
        const profileId = userDetails.additionalDetails;
        const profileDetails = await Profile.findById(profileId);
        if (!profileDetails) {
            return res.status(400).json({
                success: false,
                message: "Invalid Profile Id",
            });
        }
        //Delete account
        await Profile.findByIdAndDelete(profileId);
        //TODO: Unenroll courses of the user whose id is to delete
        //Removing profile from course
        await User.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete User profile, Internal error",
            error: err.message,
        });
    }
};

//Get all User Details
exports.getAllUserDetails = async (req, res) => {
    try {
        //Get user Id
        const id = req.user.id;
        //validation to get user details
        const userDetails = await User.findById(id)
            .populate("additionalDetails")
            .exec();

        //Success response
        return res.status(200).json({
            success: true,
            message: "User details fetched successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch all User details, Internal error",
            error: err.message,
        });
    }
};
