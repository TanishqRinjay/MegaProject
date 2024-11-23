const express = require("express");
const router = express.Router();
const { auth, isInstructor } = require("../middlewares/auth");
const { asyncLocalStorageMiddleware } = require("../middlewares/asyncLocalStorageMiddleware");
const {
    deleteProfile,
    updateProfile,
    getAllUserDetails,
    updateDisplayPicture,
    getEnrolledCourses,
    instructorDashboard,
} = require("../controllers/Profile");

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************
// Delete User Account
router.delete("/deleteProfile", auth, deleteProfile);
router.put("/updateProfile", auth, updateProfile);
router.get("/getUserDetails", auth, getAllUserDetails);
// Get Enrolled Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put(
    "/updateDisplayPicture",
    auth,
    asyncLocalStorageMiddleware,
    updateDisplayPicture
);
router.get("/instructorDasboard", auth, isInstructor, instructorDashboard);

module.exports = router;
