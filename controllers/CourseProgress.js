const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");

exports.updateCourseProgress = async (req, res) => {
    const { courseId, subSectionId } = req.body;
    const userId = req.user.id;
    try {
        //check data
        const subSection = await SubSection.findById(subSectionId);
        if (!subSection) {
            return res.status(404).json({
                error: "Invalid Sub Section",
            });
        }
        //Check old entry
        let courseProgress = await CourseProgress.findOne({
            courseId: courseId,
            userId: userId,
        });
        if (!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "Course progress does not exists",
            });
        } else {
            //Check if video isn't already completed
            if (courseProgress.completedVideos.includes(subSectionId)) {
                return res.status(400).json({
                    message: "Video already completed",
                });
            }
            courseProgress.completedVideos.push(subSectionId);
        }
        await courseProgress.save();
        return res.status(200).json({
            message: "Video marked as completed",
        });
    } catch (err) {
        console.error(err);
        return res.status(404).json({
            error: err.message,
            message: "Internal server error",
        });
    }
};
