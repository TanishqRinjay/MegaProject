// Import the required modules
const express = require("express");
const router = express.Router();

const {
    capturePayment,
    verifyPayment,
    sendPaymentSuccessEmail,
    enrollStudents,
} = require("../controllers/Payments");
const {
    auth,
    isInstructor,
    isStudent,
    isAdmin,
} = require("../middlewares/auth");
router.post("/capturePayment", auth, isStudent, enrollStudents);
router.post("/verifyPayment", auth, isStudent, verifyPayment);
router.post(
    "/sendPaymentSuccessEmail",
    auth,
    isStudent,
    sendPaymentSuccessEmail
);

module.exports = router;
