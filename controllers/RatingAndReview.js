const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const mongoose = require("mongoose");

//createRating
exports.createRating = async (req, res) => {
    try {
        //Get User's Id
        const userId = req.user.id;

        //fetch data from body
        const { rating, review, courseId } = req.body;

        //check if user is enrolled or not
        const courseDetails = await Course.findOne({
            _id: courseId,
            studentsEnrolled: { $eleMatch: { $eq: userId } },
        });
        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: "Student not enrolled in this course",
            });
        }

        //Check if user already created review
        const alreadyReviewed = RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });
        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "User already reviewed this course",
            });
        }

        //Create Review
        const ratingReview = await RatingAndReview.create({
            rating,
            review,
            course: courseId,
            user: userId,
        });

        //Update rating and review in Course
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    RatingAndReview: ratingReview._id,
                },
            },
            { new: true }
        );
        console.log(updatedCourseDetails);
        return res.status(200).json({
            success: true,
            message: "Rating and review created successfully",
            ratingReview,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to create Review",
        });
    }
};

//get average rating
exports.getAverageRating = async (req, res) => {
    try {
        //get course ID
        const courseId = req.body.courseId;

        //calculate average rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId), //converted courseId from "string" to "ObjectId"
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                },
            },
        ]);

        //Return average rating
        if(averageRating.length >0){
            return res.status(200).json({
                success: true,
                message: "Average rating fetched successfully",
                averageRating: result[0].averageRating,
            })
        }

        //if no rating/review exist
        return res.status(200).json({
            success: true,
            message: "Average rating is 0, no rating is provided till now",
            averageRating: 0, 
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to get average rating",
        });
    }
};

//getAllRating(not course specific but all)
exports.getAllRating = async (req, res) => {
    try{
        const allRatingReviews = await RatingAndReview.find({})
                                                            .sort({rating: 'desc'})
                                                            .populate({
                                                                path: 'user',
                                                                select: 'firstName lastName email image',
                                                            })
                                                            .populate({
                                                                path: 'course',
                                                                select: 'courseName',
                                                            })
                                                            .exec()
        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            allRatingReviews,
        })

    }catch(err){
        return res.status(500).json({
            success: false,
            message: "Unable to get all reviews",
        });
    }
};
