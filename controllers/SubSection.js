const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const uploadFileToCloudinary = require("../utils/fileUploader");

//SubSection creation
module.exports = async (req, res) => {
    try {
        //Data fetch
        const { title, description, timeDuration, sectionId } = req.body;

        //Extract video
        const video = req.files.videoFile;

        //Validation
        if (!title || !description || !timeDuration || !sectionId || !video) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        //Upload video to Cloudinary
        const uploadDetails = await uploadFileToCloudinary(
            video,
            process.env.FOLDER_NAME
        );

        // Create Sub Section
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

        //Update Section with new Sub Section via Section ID
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $push: {
                    subSections: subSectionDetails._id,
                },
            },
            { new: true }
        ).populate("subSection"); //Check this populate function, as it was in TODO
        console.log(updatedSection);

        //Success response
        return res.status(200).json({
            success: true,
            message: "Sub-section updated successfully",
            updatedSection,
        });
    } catch (err) {
        console.log("Problem in creating SubSection: ", err);
        return res.status(500).json({
            success: false,
            message: "Unable to create Sub-Section, Internal Error",
            error: err.message,
        });
    }
};

//Update SubSection( CHECK AS THIS WAS IN TODO)
exports.updateSubSection = async (req, res) => {
    try {
        //Fetch data
        const { title, description, timeDuration, subSectionId } = req.body;

        //Extract video
        const video = req.files.videoFile;

        //Validation
        if (!title || !description || !timeDuration || !subSectionId || !video) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        //Upload video to Cloudinary
        const uploadDetails = await uploadFileToCloudinary(
            video,
            process.env.FOLDER_NAME
        );

        //Update Sub Section
        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            {
                title: title,
                timeDuration: timeDuration,
                description: description,
                videoUrl: uploadDetails.secure_url,
            },
            { new: true }
        ).populate("section");
        console.log(updatedSubSection);
    } catch (err) {}
};

//Delete SubSection( CHECK AS THIS WAS IN TODO )
exports.deleteSubSection = async (req, res) => {
    try {
        //Fetch data
        const { subSectionId } = req.params;

        //Delete Sub Section
        await SubSection.findByIdAndDelete(subSectionId);

        //Success response
        return res.status(200).json({
            success: true,
            message: "SubSection deleted successfully",
        });
    } catch (err) {
        console.log("Error in deleting Sub Section: ", err);
        return res.status(500).json({
            success: false,
            message: "Unable to delete Sub-Section, Internal Error",
            error: err.message,
        });
    }
};
