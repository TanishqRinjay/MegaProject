const Section = require("../models/Section");
const Course = require("../models/Course");

//New Section creation
exports.createSection = async (req, res) => {
    try {
        //Data fetching
        const { sectionName, courseID } = req.body;

        //Data validation
        if (!sectionName || !courseID) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        //create new section
        const newSection = await Section.create({ sectionName });

        //Add Section to Course Schema
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseID,
            {
                $push: {
                    courseContent: newSection._id,
                },
            },
            { new: true }
        ).populate("courseContent", "courseContent.subSection"); //Check populate function as this was in TODO
        console.log(updatedCourse);

        //Success message
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourseDetails,
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
        const { sectionName, sectionId } = req.body;

        //Data validation
        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        //Update Section
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            { sectionName: sectionName },
            { new: true }
        );

        //Success response
        return res.status(200).json({
            success: true,
            message: "Section updates successfully",
            updatedSection,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to update section",
            error: err.message,
        });
    }
};

//Deleting a SubSection
exports.deleteSection = async (req, res) => {
    try {
        //Fetch data
        const { sectionId} = req.params;

        //Deleting the Section
        const deletedSection = await Section.findByIdAndDelete(sectionId);
        
        //Success response
        return res.status(200).json({
            success: true,
            message: " Section deleted successfully",
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to delete section",
            error: err.message,
        });
    }
};
