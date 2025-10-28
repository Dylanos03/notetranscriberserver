# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the backend server for a voice-to-Notion mobile app. The app records voice notes, transcribes them using OpenAI Whisper, polishes the text with GPT-4o-mini, and creates formatted notes in Notion. This is an MVP focused on simplicity and rapid validation.

Refer to `MVP.md` for detailed product requirements, user flows, and technical specifications.

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

The dev server runs on `http://localhost:8080` by default.

## Architecture

### Tech Stack
- **Runtime:** Node.js with TypeScript
- **Framework:** Express 5.x
- **External APIs:**
  - OpenAI Whisper API (transcription)
  - OpenAI GPT-4o-mini (text polishing)
  - Notion API (page creation)

### Project Structure
```
src/
  index.ts          # Main Express app and server entry point
dist/               # Compiled JavaScript output (gitignored)
```

### Planned API Endpoints

Per the MVP requirements, implement these two endpoints:

1. **`POST /api/transcribe`**
   - Accept audio file upload from mobile app
   - Send to OpenAI Whisper API
   - Return transcription text
   - Show "Transcribing..." state to client

2. **`POST /api/create-note`**
   - Accept transcribed text
   - Send to GPT-4o-mini with prompt to:
     - Remove filler words (um, uh, like)
     - Fix grammar and punctuation
     - Organize into paragraphs
     - Generate a concise title
   - Use client-provided Notion API key and Database ID to create page
   - Return success response with Notion page URL

### Key Constraints

**MVP Phase - What NOT to implement:**
- No user authentication/accounts (rely on client-provided Notion API key)
- No note history or storage
- No editing capabilities
- English language only
- Single database destination per user
- No MCP integration
- No rate limiting initially (add if costs become issue)

### Error Handling

- Return clear error messages for API failures (OpenAI, Notion)
- Handle file upload size limits (5 minute max recording ≈ 5-10MB)
- Validate Notion API key and database ID format before making requests
- Log errors but don't expose internal details to client

### Environment Variables

Expected environment variables (create `.env` file):
```
OPENAI_API_KEY=sk-...
PORT=8080
```

Note: Notion credentials come from client requests, not server config.

## TypeScript Configuration

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Output compiled to `dist/` directory

## Cost Considerations

Per MVP.md pricing:
- Whisper: $0.006/minute of audio
- GPT-4o-mini: ~$0.0001 per note
- Keep processing efficient to maintain low operational costs
