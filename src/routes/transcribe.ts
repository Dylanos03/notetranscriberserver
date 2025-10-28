import { Request, Response } from "express";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";

// Configure multer for file uploads
export const upload = multer({
  storage: multer.diskStorage({
    destination: "/tmp",
    filename: (_req, file, cb) => {
      // Use original filename with timestamp to avoid conflicts
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max (5 min recording should be under this)
  },
  fileFilter: (_req, file, cb) => {
    // Accept common audio formats
    const allowedMimes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/m4a",
      "audio/x-m4a",
      "audio/mp4",
      "audio/webm",
      "audio/ogg",
    ];
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only audio files are allowed."));
    }
  },
});

/**
 * Transcribe audio file using OpenAI Whisper
 * Handler for POST /api/transcribe
 */
export const transcribeAudio = async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No audio file provided",
        message: "Please upload an audio file with the key 'audio'",
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "OpenAI API key is not configured",
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Transcribing file: ${req.file.filename} (${req.file.size} bytes)`);

    // Transcribe the audio file using Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      language: "en", // MVP is English only
    });

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);

    console.log("Transcription successful");

    // Return the transcription
    return res.json({
      success: true,
      transcription: transcription.text,
    });
  } catch (error: any) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Transcription error:", error);

    // Handle OpenAI API errors
    if (error.response) {
      return res.status(error.response.status || 500).json({
        error: "Transcription failed",
        message: error.response.data?.error?.message || "Failed to transcribe audio",
      });
    }

    // Handle other errors
    return res.status(500).json({
      error: "Transcription failed",
      message: error.message || "An unexpected error occurred",
    });
  }
};
