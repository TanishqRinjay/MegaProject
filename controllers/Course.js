const Course = require("../models/Course");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const Category = require("../models/Categories");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
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
            instructions,
        } = req.body;
        const thumbnail = req.files.thumbnailImage;

        const parsedTag = JSON.parse(tag);
        const parsedInstructions = JSON.parse(instructions);

        //Validating data
        if (
            !courseName ||
            !courseDescription ||
            !price ||
            !tag.length ||
            !whatYouWillLearn ||
            !category ||
            !instructions.length ||
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
            tag: parsedTag,
            whatYouWillLearn: whatYouWillLearn,
            status,
            category: categoryDetails._id,
            instructor: instructorDetails._id,
            instructions: parsedInstructions,
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

// Edit Course Details
exports.editCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const updates = req.body;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // If Thumbnail Image is found, update it
        if (req.files) {
            console.log("thumbnail update");
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await uploadFileToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME
            );
            course.thumbnail = thumbnailImage.secure_url;
        }

        // Update only the fields that are present in the request body
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(updates[key]);
                } else {
                    course[key] = updates[key];
                }
            }
        }

        await course.save();

        const updatedCourse = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSections",
                },
            })
            .exec();

        res.json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
// Get Course List
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find(
            { status: "Published" },
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true,
            }
        )
            .populate("instructor")
            .exec();

        return res.status(200).json({
            success: true,
            data: allCourses,
        });
    } catch (error) {
        console.log(error);
        return res.status(404).json({
            success: false,
            message: `Can't Fetch Course Data`,
            error: error.message,
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
                populate: {
                    path: "subSections",
                    select: "title"
                },
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

exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSections",
                    // select: 'title'
                },
            })
            .exec();

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        });

        console.log("courseProgressCount : ", courseProgressCount);

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            });
        }

        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSections.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDurationInSeconds;
            });
        });

        // const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDurationInSeconds,
                completedVideos: courseProgressCount?.completedVideos
                    ? courseProgressCount?.completedVideos
                    : [],
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
    try {
        // Get the instructor ID from the authenticated user or request body
        const instructorId = req.user.id;

        // Find all courses belonging to the instructor
        const instructorCourses = await Course.find({
            instructor: instructorId,
        }).sort({ createdAt: -1 });

        // Return the instructor's courses
        res.status(200).json({
            success: true,
            data: instructorCourses,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        });
    }
};
// Delete the Course
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled;
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: { courses: courseId },
            });
        }

        // Delete sections and sub-sections
        const courseSections = course.courseContent;
        for (const sectionId of courseSections) {
            // Delete sub-sections of the section
            const section = await Section.findById(sectionId);
            if (section) {
                const subSections = section.subSections;
                for (const subSectionId of subSections) {
                    await SubSection.findByIdAndDelete(subSectionId);
                }
            }

            // Delete the section
            await Section.findByIdAndDelete(sectionId);
        }

        // Delete the course
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};
