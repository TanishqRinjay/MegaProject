const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadFileToCloudinary } = require("../utils/fileUploader");

//SubSection creation
exports.createSubSection = async (req, res) => {
    try {
        //Data fetch
        const { title, description,  sectionId } = req.body;

        //Extract video
        const video = req.files.videoFile;

        //Validation
        if (!title || !description || !sectionId || !video) {
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
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

        console.log(subSectionDetails);
        //Update Section with new Sub Section via Section ID
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $push: {
                    subSections: subSectionDetails._id,
                },
            },
            { new: true }
        ).populate("subSections"); //Check this populate function, as it was in TODO
        console.log(updatedSection);

        //Success response
        return res.status(200).json({
            success: true,
            message: "Sub-section updated successfully",
            data: updatedSection,
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
        const { title, description, timeDuration, subSectionId, videoUrl } =
            req.body;

        //Extract video
        let video = false;
        if (req.files && req.files.videoFile) {
            video = req.files.videoFile;
            // Process the video file here
          }

        //Validation
        if (!title || !description || !timeDuration || !subSectionId) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        //Upload video to Cloudinary
        let uploadDetails;
        if (video) {
            uploadDetails = await uploadFileToCloudinary(
                video,
                process.env.FOLDER_NAME
            );
        }

        //Update Sub Section
        const updatedSubSection = await SubSection.findByIdAndUpdate(
            subSectionId,
            {
                title: title,
                timeDuration: timeDuration,
                description: description,
                videoUrl: video? uploadDetails.secure_url : videoUrl,
            },
            { new: true }
        );
        console.log(updatedSubSection);
        return res.status(200).json({
            success: true,
            message: "Sub-section updated successfully",
            data: updatedSubSection,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to update Sub-Section, Internal Error",
            error: err.message,
        });
    }
};

//Delete SubSection( CHECK AS THIS WAS IN TODO )
exports.deleteSubSection = async (req, res) => {
    try {
        //Fetch data
        const { sectionId, subSectionId } = req.body;

        //Validate data
        if (!subSectionId || !sectionId) {
            return res.status(404).json({
                success: false,
                message: "All fields are required",
            });
        }

        //Check if section exists or not
        const subSectionDetails = await SubSection.findById(subSectionId);

        if (!subSectionDetails.title) {
            return res.status(404).json({
                success: false,
                message: "Sub-section with this ID does not exists",
            });
        }

        //Delete Sub-section log from Section
        const updatedSectionDetails = await Section.findByIdAndUpdate(
            sectionId,
            { $pull: { subSections: subSectionId } },
            { new: true }
        ).populate("subSections");
        if (!updatedSectionDetails) {
            return res.status(404).json({
                success: false,
                message: "Sub section with this ID does not exists",
            });
        }

        //Delete Sub Section
        await SubSection.findByIdAndDelete(subSectionId);

        //Success response
        return res.status(200).json({
            success: true,
            message: "SubSection deleted successfully",
            data: updatedSectionDetails,
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
