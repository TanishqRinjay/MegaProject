require("dotenv").config();

const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const pdf = require("pdf-parse");
const { spawn } = require("child_process");
const { chatGPT } = require("./ChatGPT");
const path = require("path");
const { chatGPTSummarizer } = require("./ChatGPT");

exports.videoToAudioTranscribe = async (req, res) => {
    const videoUrl = req.body.videoUrl;

    try {
        // Download the video file

        fs.unlink("output.pdf", (err) => {
            if (err) {
                console.error("Error deleting PDF file:", err);
            } else {
                console.log("PDF file deleted successfully.");
            }
        });

        const videoFileName = "input.mp4"; // Set a temporary file name
        const videoFilePath = `${__dirname}/${videoFileName}`;
        const writer = fs.createWriteStream(videoFilePath);

        const response = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream",
        });

        response.data.pipe(writer);

        writer.on("finish", async () => {
            console.log("Video download complete");

            // Convert video to audio
            const audioFilePath = "output.mp3";
            const ffmpegProcess = spawn("ffmpeg", [
                "-i",
                videoFilePath,
                "-vn", // Extract audio only
                "-f",
                "mp3", // Output format
                "-ac",
                "2", // Stereo output
                audioFilePath, // Output file path
            ]);

            ffmpegProcess.on("exit", async () => {
                console.log("Conversion to audio complete");

                // Read the converted audio file
                const audioData = fs.readFileSync(audioFilePath);

                // Upload audio to AssemblyAI for transcription

                const baseUrl = "https://api.assemblyai.com/v2";

                const headers = {
                    authorization: "7deeff2b8e7a4f1c834e89c168b9f7d0",
                };
                const uploadResponse = await axios.post(
                    `${baseUrl}/upload`,
                    audioData,
                    {
                        headers,
                    }
                );
                const uploadUrl = uploadResponse.data.upload_url;
                const data = {
                    audio_url: uploadUrl, // You can also use a URL to an audio or video file on the web
                };
                const url = `${baseUrl}/transcript`;
                const response = await axios.post(url, data, {
                    headers: headers,
                });
                const transcriptId = response.data.id;
                const pollingEndpoint = `${baseUrl}/transcript/${transcriptId}`;
                let transcribedText = "";
                while (true) {
                    const pollingResponse = await axios.get(pollingEndpoint, {
                        headers: headers,
                    });
                    const transcriptionResult = pollingResponse.data;

                    if (transcriptionResult.status === "completed") {
                        transcribedText = transcriptionResult.text;

                        console.log("Transcribed Text: ", transcribedText);

                        // TO UNCOMMENT
                        // outputStream.on("finish", () => {
                        //     fs.unlink("output.pdf", (err) => {
                        //         if (err) {
                        //             console.error(
                        //                 "Error deleting PDF file:",
                        //                 err
                        //             );
                        //         } else {
                        //             console.log(
                        //                 "PDF file deleted successfully."
                        //             );
                        //         }
                        //     });
                        // });
                        break;
                    } else if (transcriptionResult.status === "error") {
                        throw new Error(
                            `Transcription failed: ${transcriptionResult.error}`
                        );
                    } else {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 3000)
                        );
                    }
                }

                // Now, use upload_url to submit the audio for transcription
                // You would continue here with the transcription process
                // See AssemblyAI documentation for details on transcription API

                console.log("Transcription complete");

                // Delete the temporary video and audio files
                fs.unlinkSync(videoFilePath);
                fs.unlinkSync(audioFilePath);
                transcribedText = `You are document assistant and your name is 'EduNxt Helper' and you have data named lecture which is in text containing ${transcribedText} and answer for any query asked which is not in context to this lecture/data will be 'This question was not in lecture', correct spellings then answer`;
                const summaryResponse = await chatGPTSummarizer(
                    transcribedText,
                    [
                        {
                            role: "user",
                            content: "Summarize this lecture in keypoints",
                        },
                    ]
                );
                console.log("Summary Response: ", summaryResponse);
                const PDFDocument = require("pdfkit");
                // Create a new PDF document
                const doc = new PDFDocument();

                // Pipe the PDF output to a file
                const outputStream = fs.createWriteStream("output.pdf");
                doc.pipe(outputStream);

                // Add text to the PDF document
                doc.fontSize(12).text(summaryResponse);

                // Finalize the PDF document
                doc.end();

                console.log("PDF generated successfully.");
                return res
                    .status(200)
                    .json({ success: true, data: transcribedText });
            });

            ffmpegProcess.on("error", (err) => {
                console.error("Error converting video to audio:", err);
                res.status(500).json({ success: false, error: err.message });
            });
        });

        writer.on("error", (err) => {
            console.error("Error downloading video:", err);
            res.status(500).json({ success: false, error: err.message });
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.downloadPDFNotes = async (req, res) => {
    const pdfReader = async (filePath) => {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            console.log(dataBuffer);
            const pdfdata = await pdf(dataBuffer);
            const text = pdfdata.text;
            console.log(text);
        } catch (err) {
            console.log(err);
        }
    };
    const filePath = path.join(__dirname, "..", "output.pdf");
    pdfReader(filePath);
    res.download(filePath, "output.pdf", (err) => {
        if (err) {
            // Handle error, but don't expose to the client
            console.error(err);
            res.status(500).send("Couldn't download the file.");
        }
    });
};
