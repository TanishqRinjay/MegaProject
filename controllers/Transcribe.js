require("dotenv").config();

const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs-extra");
const { spawn } = require("child_process");

exports.videoToAudioTranscribe = async (req, res) => {
    const { videoUrl } = req.body;

    try {
        // Download the video file
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

                while (true) {
                    const pollingResponse = await axios.get(pollingEndpoint, {
                        headers: headers,
                    });
                    const transcriptionResult = pollingResponse.data;

                    if (transcriptionResult.status === "completed") {
                        const transcribedText = transcriptionResult.text;
                        const PDFDocument = require("pdfkit");

                        // Create a new PDF document
                        const doc = new PDFDocument();

                        // Pipe the PDF output to a file
                        const outputStream = fs.createWriteStream("output.pdf");
                        doc.pipe(outputStream);

                        // Add text to the PDF document
                        doc.fontSize(12).text(
                            transcribedText
                        );

                        // Finalize the PDF document
                        doc.end();

                        console.log("PDF generated successfully.");
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

                res.json({ success: true });
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
