//Importing required modules
const express = require("express");
const router = express.Router();

//Import Controller

const { contactUsMail } = require("../controllers/ContactUs");

router.post("/contact", contactUsMail);

module.exports = router;
