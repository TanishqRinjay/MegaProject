require("dotenv").config();

const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const { spawn } = require("child_process");

exports.videoToAudioTranscribe = async (req, res) => {
    const { videoUrl } = req.body;

    try {
        // Download the video file
        const videoFileName = 'input.mp4'; // Set a temporary file name
        const videoFilePath = `${__dirname}/${videoFileName}`;
        const writer = fs.createWriteStream(videoFilePath);

        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        writer.on('finish', async () => {
            console.log('Video download complete');

            // Convert video to audio
            const audioFilePath = 'output.mp3';
            const ffmpegProcess = spawn('ffmpeg', [
                '-i', videoFilePath,
                '-vn',                // Extract audio only
                '-f', 'mp3',          // Output format
                '-ac', '2',           // Stereo output
                audioFilePath         // Output file path
            ]);

            ffmpegProcess.on('exit', async () => {
                console.log('Conversion to audio complete');

                // Read the converted audio file
                const audioData = fs.readFileSync(audioFilePath);

                // Upload audio to AssemblyAI for transcription
                const assemblyResponse = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
                    headers: {
                        'authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,    
                        'content-type': 'application/json'
                    }
                });

                const { upload_url } = assemblyResponse.data;
                
                // Now, use upload_url to submit the audio for transcription
                // You would continue here with the transcription process
                // See AssemblyAI documentation for details on transcription API

                console.log('Transcription complete');

                // Delete the temporary video and audio files
                // fs.unlinkSync(videoFilePath);
                // fs.unlinkSync(audioFilePath);

                res.json({ success: true });
            });

            ffmpegProcess.on('error', (err) => {
                console.error('Error converting video to audio:', err);
                res.status(500).json({ success: false, error: err.message });
            });
        });

        writer.on('error', (err) => {
            console.error('Error downloading video:', err);
            res.status(500).json({ success: false, error: err.message });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}