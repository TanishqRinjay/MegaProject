const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const Course = require("../models/Course");

//New Section creation
exports.createSection = async (req, res) => {
    try {
        //Data fetching
        const { sectionName, courseId } = req.body;

        //Data validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        //create new section
        const newSection = await Section.create({ sectionName });

        //Add Section to Course Schema
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    courseContent: newSection._id,
                },
            },
            { new: true }
        )
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSections",
                },
            })
            .exec(); //Check populate function as this was in TODO
        console.log(updatedCourseDetails);

        //Success message
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            data: updatedCourseDetails,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to create section",
            error: err.message,
        });
    }
};

//Updating a Section
exports.updateSection = async (req, res) => {
    try {
        //Data fetching
        const { sectionName, sectionId, courseId } = req.body;

        //Data validation
        if (!sectionName || !sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        //Update Section
        await Section.findByIdAndUpdate(
            sectionId,
            { sectionName: sectionName },
        );
        const updatedCourse = await Course.findById(courseId).populate({
            path:"courseContent",
            populate:{
                path:"subSections"
            }
        }).exec()

        //Success response
        return res.status(200).json({
            success: true,
            message: "Section updates successfully",
            data: updatedCourse,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to update section",
            error: err.message,
        });
    }
};

// Show all Sections
exports.showAllSections = async (req, res) => {
    try {
        //Fetch data
        const { courseId } = req.body;
        const getCourse = await Course.findById(courseId).populate({
            path: "courseContent",
            populate: {
                path: "subSections",
            },
        });
        const allSections = getCourse.courseContent;
        //return response
        return res.status(200).json({
            success: true,
            message: "All sections details fetched successfully",
            allSections,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch all sections details",
            error: err.message,
        });
    }
};

//Deleting a SubSection
exports.deleteSection = async (req, res) => {
    try {
        //Fetch data
        const { courseId, sectionId } = req.body;

        //Validate data
        if (!courseId || !sectionId) {
            return res.status(404).json({
                success: false,
                message: "All fields are required",
            });
        }

        //Check if section exists or not
        const sectionDetails = await Section.findById(sectionId);
        if (!sectionDetails.sectionName) {
            return res.status(404).json({
                success: false,
                message: "Section with this ID does not exists",
            });
        }
        console.log(sectionDetails);

        //Deleting log of section from Course
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $pull: {
                    courseContent: sectionId,
                },
            },
            { new: true }
        ).populate({
            path: "courseContent",
            populate: {
                path: "subSections",
            },
        });

        //Deleting subSection with in that section
        await SubSection.deleteMany({ _id: { $in: Section.SubSection } });

        //Deleting the Section
        await Section.findByIdAndDelete(sectionId);

        //Success response
        return res.status(200).json({
            success: true,
            message: " Section deleted successfully",
            updatedCourseDetails,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete section",
            error: err.message,
        });
    }
};
