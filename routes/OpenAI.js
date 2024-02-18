// Import the required modules
const express = require("express");
const router = express.Router();

const {videoToAudioTranscribe} = require("../controllers/Transcribe");
const {chatGPT} = require("../controllers/ChatGPT");
const {downloadPDFNotes} = require("../controllers/Transcribe")


// ********************************************************************************************************
//                                      Video To PDF
// ********************************************************************************************************

router.post("/transcribe", videoToAudioTranscribe);

// ********************************************************************************************************
//                                      chat with GPT
// ********************************************************************************************************

router.post("/chat", chatGPT);
module.exports = router;

// ********************************************************************************************************
//                                      download PDF Notes
// ********************************************************************************************************

router.get("/download", downloadPDFNotes);