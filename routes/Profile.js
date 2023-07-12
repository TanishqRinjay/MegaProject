const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const {
    deleteProfile,
    updateProfile,
    getAllUserDetails,
    updateDisplayPicture,
    getEnrolledCourses,
} = require("../controllers/Profile");

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
// Delet User Account
router.delete("/deleteProfile", deleteProfile);
router.put("/updateProfile", auth, updateProfile);
router.get("/getUserDetails", auth, getAllUserDetails);
// Get Enrolled Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put("/updateDisplayPicture", auth, updateDisplayPicture);

module.exports = router;
