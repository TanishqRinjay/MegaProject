const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
    courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { response } = require("express");

//Capture the payment and initiate the RazorPay order
exports.capturePayment = async (req, res) => {
    try {
        //Get Data
        const { courseId } = req.body;
        const userId = req.user.id;
        //Validation
        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid course ID",
            });
        }
        let course;
        try {
            course = await Course.findById(courseId);
            if (!course) {
                return res.status(400).json({
                    success: false,
                    message: "Could not find selected course",
                });
            }

            //Check if user is already enrolled in this course
            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({
                    success: false,
                    message: "User is already enrolled in this course",
                });
            }
        } catch (err) {
            console.log("Invalid course ID: ", err);
            return res.status(500).json({
                success: false,
                message: "Please provide valid course ID",
            });
        }

        //Order creation
        const amount = course.price;
        const currency = "INR";
        const options = {
            amount: amount * 100,
            currency,
            receipt: Math.random(Date.now()).toString(),
            notes: {
                courseId,
                userId,
            },
        };

        try {
            //Initiate paymente using Razorpay
            const paymentResponse = await instance.orders.create(options);
            console.log(paymentResponse);

            //Returning success response
            return res.status(200).json({
                success: true,
                message: "Payment created successfully",
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                thumbnail: course.thumbnail,
                orderId: paymentResponse.orderId,
                currency: paymentResponse.currency,
                amount: paymentResponse.amount,
            });
        } catch (err) {
            console.log("Error in initiating order: ", err);
            return res.status(400).json({
                success: false,
                message: "Error in initiating payment",
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error in capturing payment",
        });
    }
};

//Verify signature of RazorPay and server
exports.verifySignature = async (req, res) => {
    const webhookSecret = "123456";
    const signature = req.headers["x-razorpay-signature"];
    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");
    if (signature === digest) {
        console.log("Payment is authorized");

        //Retrieving Ids from Razorpay return payload
        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try {
            //Find course and add student
            const enrolledCourse = await Course.findOneAndUpdate(
                courseId,
                { $push: { studentsEnrolled: userId } },
                { new: true }
            );
            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Could not find course",
                });
            }
            console.log(enrolledCourse);

            //Find student and add course
            const enrolledStudent = await User.findByIdAndUpdate(
                userId,
                { $push: { courses: courseId } },
                { new: true }
            );
            if (!enrolledStudent) {
                return res.status(500).json({
                    success: false,
                    message: "Could not find student",
                });
            }
            console.log(enrolledStudent);

            //Send mail to student
            const emailResponse = await mailSender(
                enrolledStudent.email,
                "Congratulations from Studynotion",
                "Congratulations for onboarding onto new course"
            );
            console.log(emailResponse);
            return res.status(200).json({
                success: true,
                message: "Signature verified and Course added",
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
    else{
        return res.status(400).json({
            success: false,
            message: "Invalid signature",
        })
    }
};
