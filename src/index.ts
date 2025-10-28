import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { transcribeAudio, upload } from "./routes/transcribe";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from TypeScript + Express!");
});

// Transcribe endpoint
app.post("/api/transcribe", upload.single("audio"), transcribeAudio);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
