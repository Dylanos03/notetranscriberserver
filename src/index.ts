import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { transcribeAudio, upload } from "./routes/transcribe";
import { createNote } from "./routes/createNote";
import { notionCallback } from "./routes/notionAuth";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("NoteTranscriber Up and Running");
});

// Transcribe endpoint
app.post("/api/transcribe", upload.single("audio"), transcribeAudio);

// Create note endpoint
app.post("/api/create-note", createNote);

// Notion OAuth callback endpoint
app.get("/api/notion/callback", notionCallback);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
