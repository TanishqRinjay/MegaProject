const Course = require("../models/Course");
const Category = require("../models/Categories");
const User = require("../models/User");
const { uploadFileToCloudinary } = require("../utils/fileUploader");
require("dotenv").config();

//Create course Handler function
exports.createCourse = async (req, res) => {
    try {
        //Getting data and Thumbnail
        let {
            courseName,
            courseDescription,
            price,
            tag,
            status,
            whatYouWillLearn,
            category,
        } = req.body;
        const thumbnail = req.files.thumbnailImage;

        //Validating data
        if (
            !courseName ||
            !courseDescription ||
            !price ||
            !tag ||
            !whatYouWillLearn ||
            !category ||
            !thumbnail
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        //Check for Instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor",
        });
        console.log("Instructor details: ", instructorDetails);
        //TODO: Check if userId and instructorDetails._id are same?

        //If we can't find Instructor details, in case of error
        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found",
            });
        }

        //Check if given tag is valid or not
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category details not found",
            });
        }

        //Thumbnail upload in cloudinary
        const thumbnailImage = await uploadFileToCloudinary(
            thumbnail,
            process.env.FOLDER_NAME
        );

        //Create status for course(published, draft etc)
        if (!status || status === undefined) {
            status = "Draft";
        }

        //Create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            price,
            tag: tag,
            whatYouWillLearn: whatYouWillLearn,
            status,
            category: categoryDetails._id,
            instructor: instructorDetails._id,
            thumbnail: thumbnailImage.secure_url,
        });

        //Add this new Course to User(Instructor's) Shema model
        await User.findByIdAndUpdate(
            { _id: instructorDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            { new: true }
        );

        //Updating Category Schema, it was in TODO, so check with bhaiya
        await Category.findByIdAndUpdate(
            { _id: categoryDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            { new: true }
        );
        res.status(200).json({
            success: true,
            message: "Course created successfully",
            data: newCourse,
        });
    } catch (err) {
        console.log("Error while creating new course: ", err);
        res.status(500).json({
            success: false,
            message: "Unable to create course, internal error",
            error: err.message,
        });
    }
};

//getAllCourse Handler
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find({});
        return res.status(200).json({
            success: true,
            message: "All courses fetched successfully",
            data: allCourses,
        });
    } catch (err) {
        console.log("Error while fetching courses data: ", err);
        res.status(500).json({
            success: false,
            message: "Cannot fetch courses data",
            error: err.message,
        });
    }
};

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
    try {
        //get Id
        const { courseId } = req.body;

        //find Course details
        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            // .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                // populate: {
                //     path: "subSection",
                // },
            })
            .exec();
        //Validation
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with course ID ${courseId}`,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Course fetched successfully",
            data: courseDetails,
        });
    } catch (err) {
        console.log("Error in fetching course details: ", err);
        return res.status(500).json({
            success: true,
            message: err.message,
        });
    }
};
