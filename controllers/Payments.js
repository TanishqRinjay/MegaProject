const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
    courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const {
    paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");
const crypto = require("crypto");
const mongoose = require("mongoose");
const CourseProgress = require("../models/CourseProgress");

require("dotenv").config();

exports.capturePayment = async (req, res) => {
    console.log("hello anubhav");
    const { courses } = req.body;
    const userId = req.user.id;
    if (courses.length === 0) {
        return res.json({
            success: false,
            message: "Please Provide Course ID",
        });
    }

    let total_amount = 0;

    for (const course_id of courses) {
        let course;
        try {
            // Find the course by its ID
            course = await Course.findById(course_id);

            // If the course is not found, return an error
            if (!course) {
                return res.status(200).json({
                    success: false,
                    message: "Could not find the Course",
                });
            }

            // Check if the user is already enrolled in the course
            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({
                    success: false,
                    message: "Student is already Enrolled",
                });
            }

            // Add the price of the course to the total amount
            total_amount += course.price;
        } catch (error) {
            console.log(error);
            return res
                .status(500)
                .json({ success: false, message: error.message });
        }
    }

    const options = {
        amount: total_amount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
    };

    try {
        // Initiate the payment using Razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log("payment response", paymentResponse);
        return res.status(200).json({
            success: true,
            data: paymentResponse,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Could not initiate order.",
        });
    }
};

// verify the payment
exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    console.log(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    const userId = req.user.id;

    if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !courses ||
        !userId
    ) {
        return res
            .status(200)
            .json({ success: false, message: "Payment Failed" });
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res);
        return res
            .status(200)
            .json({ success: true, message: "Payment Verified" });
    }

    return res.status(200).json({ success: false, message: "Payment Failed" });
};

const enrollStudents = async (courses, userId, res) => {
    try {
        // if(!courses|| !userId)
        for (const courseId of courses) {
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnrolled: userId } },
                { new: true }
            );
            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to enroll student as course isn't found",
                });
            }

            const courseProgress = await CourseProgress.create({
                courseId: courseId,
                userId: userId,
                completedVideos: [],
            });

            //Find the student and add the course to their list of Enrolled Courses
            const enrolledStudent = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id,
                    },
                },
                { new: true }
            );
            console.log("Enrolled student: ", enrolledStudent);
            //Send mail to student about enrollment
            const emailResponse = await mailSender(
                enrolledStudent.email,
                `Successfully enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            );
            console.log("Email sent successfully", emailResponse.response);
        }
        // const enrolledStudent = await User.findByIdAndUpdate(userId, {$push: {courses: {$each: courses}}}, {new: true})
    } catch (err) {
        return res.status(500).json({
            success: false,
            meassage: err.message,
        });
    }
};

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body;

    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide all the details",
        });
    }

    try {
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Received`,
            paymentSuccessEmail(
                `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
                amount / 100,
                orderId,
                paymentId
            )
        );
    } catch (error) {
        console.log("error in sending mail", error);
        return res
            .status(400)
            .json({ success: false, message: "Could not send email" });
    }
};

// enroll the student in the courses
exports.enrollStudents = async (req, res) => {
    const { courses } = req.body;
    const userId = req.user.id;
    if (!courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please Provide Course ID and User ID",
        });
    }

    for (const courseId of courses) {
        try {
            // Find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnrolled: userId } },
                { new: true }
            );

            if (!enrolledCourse) {
                return res
                    .status(500)
                    .json({ success: false, error: "Course not found" });
            }
            console.log("Updated course: ", enrolledCourse);

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            });
            // Find the student and add the course to their list of enrolled courses
            const enrolledStudent = await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id,
                    },
                },
                { new: true }
            );

            console.log("Enrolled student: ", enrolledStudent);
            // Send an email notification to the enrolled student
            const emailResponse = await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            );

            console.log("Email sent successfully: ", emailResponse.response);

            return res.status(200).json({
                success: true,
                message: "Student Enrolled Successfully",
            });
        } catch (error) {
            console.log(error);
            return res
                .status(400)
                .json({ success: false, error: error.message });
        }
    }
};

// exports.capturePayment = async (req, res) => {
//     try {
//         const { courses } = req.body;
//         const userId = req.user.id;
//         console.log(userId)
//         if (courses.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "No courses were found in the cart",
//             });
//         }
//         let totalAmount = 0;
//         for (const course_id of courses) {
//             let course;
//             try {
//                 course = await Course.findById(course_id);
//                 if (!course) {
//                     return res.status(404).json({
//                         success: false,
//                         message: "No course with this id is found",
//                     });
//                 }
//                 const uid = new mongoose.Types.ObjectId(userId);
//                 if (course.studentsEnrolled.includes(uid)) {
//                     return res.status(500).json({
//                         success: false,
//                         message: "Student is already enrolled in this course",
//                     });
//                 }
//                 totalAmount += course.price;
//             } catch (err) {
//                 console.log(err);
//                 return res.status(500).json({
//                     success: false,
//                     message: err.message,
//                 });
//             }
//         }

//         // TO UNCOMMENT
//         const options = {
//             amount: totalAmount * 100,
//             currency: "INR",
//             receipt: Math.random(Date.now()).toString(),
//         };
//         try {
//             const paymentResponse = await instance.orders.create(options);
//             return res.json({
//                 success: true,
//                 data: paymentResponse,
//             });
//         } catch (err) {
//             console.log(err);
//             return res
//                 .status(500)
//                 .json({ success: false, message: "Couldn't create order" });
//         }
//     } catch (err) {
//         return res.status(404).json({
//             success: false,
//             message: "Something went wrong while capturing payment",
//             error: err,
//         });
//     }
// };

// exports.verifyPayment = async (req, res) => {
//     const razorpay_order_id = req.body?.razorpay_order_id;
//     const razorpay_payment_id = req.body?.razorpay_payment_id;
//     const razorpay_signature = req.body?.razorpay_signature;
//     const courses = req.body?.courses;
//     const userId = req.user.id;

//     if (
//         !razorpay_order_id ||
//         !razorpay_payment_id ||
//         !razorpay_signature ||
//         !courses ||
//         !userId
//     ) {
//         return res.status(500).json({
//             success: false,
//             message: "Payment failed",
//         });
//     }
//     let body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_SECRET)
//         .update(body.toString())
//         .digest("hex");
//     if (expectedSignature === razorpay_signature) {
//         //Enroll that student into those courses
//         await enrollStudent(courses, userId, res);

//         return res.status(200).json({
//             success: true,
//             message: "Payment verified",
//         });
//     }
// };

// const enrollStudent = async (courses, userId, res) => {
//     try {
//         // if(!courses|| !userId)
//         for (const courseId of courses) {
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 { _id: courseId },
//                 { $push: { studentsEnrolled: userId } },
//                 { new: true }
//             );
//             if (!enrolledCourse) {
//                 return res.status(500).json({
//                     success: false,
//                     message: "Failed to enroll student as course isn't found",
//                 });
//             }

//             const courseProgress = await CourseProgress.create({
//                 courseId: courseId,
//                 userId: userId,
//                 completedVideos: [],
//             })

//             //Find the student and add the course to their list of Enrolled Courses
//             const enrolledStudent = await User.findOneAndUpdate(
//                 {_id: userId},
//                 { $push: { courses: courseId,
//                     courseProgress: courseProgress._id
//                 } },
//                 { new: true }
//             );
//                 console.log("Enrolled student: ", enrolledStudent)
//             //Send mail to student about enrollment
//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 `Successfully enrolled into ${enrolledCourse.courseName}`,
//                 courseEnrollmentEmail(
//                     enrolledCourse.courseName,
//                     `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
//                 )
//             );
//             // console.log("Email sent successfully", emailResponse.response);
//         }
//         // const enrolledStudent = await User.findByIdAndUpdate(userId, {$push: {courses: {$each: courses}}}, {new: true})
//     } catch (err) {
//         return res.status(500).json({
//             success: false,
//             meassage: err.message,
//         });
//     }
// };

// exports.sendPaymentSuccessEmail = async (req, res) => {
//     const { orderId, paymentId, amount } = req.body;
//     const userId = req.user.id;

//     if (!userId || !paymentId || !amount || !userId) {
//         return res.status(400).json({
//             success: false,
//             message: "Please fill all the fields",
//         });
//     }
//     try {
//         const enrolledStudent = await User.findById(userId);
//         console.log("enrolled Student: ",enrolledStudent.email)
//         await mailSender(
//             enrolledStudent.email,
//             "Successful Payment",
//             paymentSuccessEmail(
//                 `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
//                 amount / 100,
//                 orderId,
//                 paymentId
//             )
//         );
//     } catch (err) {
//         console.log("Error in sending email: ", err);
//         return res.status(500).json({
//             success: false,
//             message: "could not send mail",
//         });
//     }
// };

// <-----------------------------OLD CODE-------------------------------->

//Capture the payment and initiate the RazorPay order
// exports.capturePayment = async (req, res) => {
//     try {
//         //Get Data
//         const { courseId } = req.body;
//         const userId = req.user.id;
//         //Validation
//         if (!courseId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Please provide valid course ID",
//             });
//         }
//         let course;
//         try {
//             course = await Course.findById(courseId);
//             if (!course) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Could not find selected course",
//                 });
//             }

//             //Check if user is already enrolled in this course
//             const uid = new mongoose.Types.ObjectId(userId);
//             if (course.studentsEnrolled.includes(uid)) {
//                 return res.status(200).json({
//                     success: false,
//                     message: "User is already enrolled in this course",
//                 });
//             }
//         } catch (err) {
//             console.log("Invalid course ID: ", err);
//             return res.status(500).json({
//                 success: false,
//                 message: "Please provide valid course ID",
//             });
//         }

//         //Order creation
//         const amount = course.price;
//         const currency = "INR";
//         const options = {
//             amount: amount * 100,
//             currency,
//             receipt: Math.random(Date.now()).toString(),
//             notes: {
//                 courseId,
//                 userId,
//             },
//         };

//         try {
//             //Initiate paymente using Razorpay
//             const paymentResponse = await instance.orders.create(options);
//             console.log(paymentResponse);

//             //Returning success response
//             return res.status(200).json({
//                 success: true,
//                 message: "Payment created successfully",
//                 courseName: course.courseName,
//                 courseDescription: course.courseDescription,
//                 thumbnail: course.thumbnail,
//                 orderId: paymentResponse.orderId,
//                 currency: paymentResponse.currency,
//                 amount: paymentResponse.amount,
//             });
//         } catch (err) {
//             console.log("Error in initiating order: ", err);
//             return res.status(400).json({
//                 success: false,
//                 message: "Error in initiating payment",
//             });
//         }
//     } catch (err) {
//         return res.status(500).json({
//             success: false,
//             message: "Error in capturing payment",
//         });
//     }
// };

// //Verify signature of RazorPay and server
// exports.verifySignature = async (req, res) => {
//     const webhookSecret = "123456";
//     const signature = req.headers["x-razorpay-signature"];
//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");
//     if (signature === digest) {
//         console.log("Payment is authorized");

//         //Retrieving Ids from Razorpay return payload
//         const { courseId, userId } = req.body.payload.payment.entity.notes;

//         try {
//             //Find course and add student
//             const enrolledCourse = await Course.findOneAndUpdate(
//                 courseId,
//                 { $push: { studentsEnrolled: userId } },
//                 { new: true }
//             );
//             if (!enrolledCourse) {
//                 return res.status(500).json({
//                     success: false,
//                     message: "Could not find course",
//                 });
//             }
//             console.log(enrolledCourse);

//             //Find student and add course
//             const enrolledStudent = await User.findByIdAndUpdate(
//                 userId,
//                 { $push: { courses: courseId } },
//                 { new: true }
//             );
//             if (!enrolledStudent) {
//                 return res.status(500).json({
//                     success: false,
//                     message: "Could not find student",
//                 });
//             }
//             console.log(enrolledStudent);

//             //Send mail to student
//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from EduNxt",
//                 "Congratulations for onboarding onto new course"
//             );
//             console.log(emailResponse);
//             return res.status(200).json({
//                 success: true,
//                 message: "Signature verified and Course added",
//             });
//         } catch (err) {
//             console.log(err);
//             return res.status(500).json({
//                 success: false,
//                 message: err.message,
//             });
//         }
//     }
//     else{
//         return res.status(400).json({
//             success: false,
//             message: "Invalid signature",
//         })
//     }
// };
