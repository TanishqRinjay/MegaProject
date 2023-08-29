const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const { uploadFileToCloudinary } = require("../utils/fileUploader");

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
        const updatedUserDetails = await User.findById(id).populate("additionalDetails").exec()
        updatedUserDetails.password = null;

        //Success response
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            updatedUserDetails,
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
exports.deleteProfile = async (req, res) => {
    try {
        //Fetch data
        const id = req.user.id;
        console.log(id)
        //Validate Id
        const userDetails = await User.findById(id);
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "Invalid User Id",
            });
        }

        //Delete account
        //First we're deleting User's profile additional Details
        await Profile.findByIdAndDelete(userDetails.additionalDetails);
        //TODO: Unenroll courses of the user whose id is to delete
        //Removing profile from course

        //Now we're deleting all details of the User
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
            userDetails
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch all User details, Internal error",
            error: err.message,
        });
    }
};

//Update DP
exports.updateDisplayPicture = async (req, res) => {
    try {
        const displayPicture = req.files.displayPicture;
        const userId = req.user.id;
        const image = await uploadFileToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        );
        console.log(image);
        const updatedProfile = await User.findByIdAndUpdate(
            { _id: userId },
            { image: image.secure_url },
            { new: true }
        ).populate("additionalDetails").exec();
        res.send({
            success: true,
            message: `Image Updated successfully`,
            data: updatedProfile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in image upload",
            error: error.message
        });
    }
};

// Get all enrolledd courses
exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const userDetails = await User.findOne({
            _id: userId,
        })
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate:{
                        path: "subSections"
                    }
                }
            })
            .exec();
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`,
            });
        }
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
