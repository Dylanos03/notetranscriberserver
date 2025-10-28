# NoteTranscriber API Documentation

Base URL: `http://localhost:8080` (development)

## Endpoints

### 1. Health Check

**GET /**

Check if the server is running.

**Response:**
```
NoteTranscriber Up and Running
```

---

### 2. Transcribe Audio

**POST /api/transcribe**

Upload an audio file and receive a transcription using OpenAI Whisper.

#### Request

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- `audio` (file, required): Audio file to transcribe
  - Supported formats: mp3, wav, m4a, mp4, webm, ogg
  - Max file size: 10MB
  - Max duration: ~5 minutes

#### Success Response (200 OK)

```json
{
  "success": true,
  "transcription": "This is the transcribed text from the audio file."
}
```

#### Error Responses

**400 Bad Request** - No file uploaded
```json
{
  "error": "No audio file provided",
  "message": "Please upload an audio file with the key 'audio'"
}
```

**400 Bad Request** - Invalid file type
```json
{
  "error": "Invalid file type. Only audio files are allowed."
}
```

**413 Payload Too Large** - File too large
```json
{
  "error": "File too large"
}
```

**500 Internal Server Error** - Server configuration error
```json
{
  "error": "Server configuration error",
  "message": "OpenAI API key is not configured"
}
```

**500 Internal Server Error** - Transcription failed
```json
{
  "error": "Transcription failed",
  "message": "Error details..."
}
```

#### Example cURL

```bash
curl -X POST http://localhost:8080/api/transcribe \
  -F "audio=@/path/to/audio.m4a"
```

#### Example JavaScript (React Native)

```javascript
const formData = new FormData();
formData.append('audio', {
  uri: audioFileUri,
  type: 'audio/m4a',
  name: 'recording.m4a',
});

const response = await fetch('http://localhost:8080/api/transcribe', {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const data = await response.json();
console.log(data.transcription);
```

---

### 3. Create Note in Notion

**POST /api/create-note**

Polish a transcription with AI and create a formatted page in Notion.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "transcription": "Raw transcription text to be polished",
  "notionApiKey": "secret_xxx...",
  "notionDatabaseId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Parameters:**
- `transcription` (string, required): The raw transcription text from Whisper
- `notionApiKey` (string, required): User's Notion integration token
- `notionDatabaseId` (string, required): ID of the Notion database to create the page in

#### Success Response (200 OK)

```json
{
  "success": true,
  "notionPageUrl": "https://www.notion.so/Page-Title-xxxxx",
  "title": "Generated Title",
  "polishedText": "This is the polished version of the transcription with proper grammar, punctuation, and paragraph structure."
}
```

#### Error Responses

**400 Bad Request** - Missing required fields
```json
{
  "error": "Missing required field",
  "message": "Transcription text is required"
}
```

**401 Unauthorized** - Invalid Notion API key
```json
{
  "error": "Notion authentication failed",
  "message": "Invalid Notion API key. Please check your integration token."
}
```

**404 Not Found** - Database not found
```json
{
  "error": "Notion database not found",
  "message": "The specified database ID was not found or the integration doesn't have access to it."
}
```

**400 Bad Request** - Database validation error
```json
{
  "error": "Notion validation error",
  "message": "The database structure may not match expected properties."
}
```

**500 Internal Server Error** - Server configuration error
```json
{
  "error": "Server configuration error",
  "message": "OpenAI API key is not configured"
}
```

**500 Internal Server Error** - AI processing failed
```json
{
  "error": "AI processing failed",
  "message": "Error details..."
}
```

#### Example cURL

```bash
curl -X POST http://localhost:8080/api/create-note \
  -H "Content-Type: application/json" \
  -d '{
    "transcription": "Um, so like, I had this idea for a new feature...",
    "notionApiKey": "secret_xxxxxxxxxxxxx",
    "notionDatabaseId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }'
```

#### Example JavaScript (React Native)

```javascript
const response = await fetch('http://localhost:8080/api/create-note', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transcription: transcriptionText,
    notionApiKey: userNotionApiKey,
    notionDatabaseId: userDatabaseId,
  }),
});

const data = await response.json();
console.log('Notion page created:', data.notionPageUrl);
```

---

## Complete User Flow

### Step 1: Record and Transcribe

```javascript
// 1. Record audio using React Native Audio library
const audioUri = await recordAudio();

// 2. Upload to transcribe endpoint
const formData = new FormData();
formData.append('audio', {
  uri: audioUri,
  type: 'audio/m4a',
  name: 'recording.m4a',
});

const transcribeResponse = await fetch('http://localhost:8080/api/transcribe', {
  method: 'POST',
  body: formData,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const { transcription } = await transcribeResponse.json();
```

### Step 2: Polish and Save to Notion

```javascript
// 3. Send transcription to create note endpoint
const noteResponse = await fetch('http://localhost:8080/api/create-note', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transcription,
    notionApiKey: userNotionApiKey, // From user's settings
    notionDatabaseId: userDatabaseId, // From user's settings
  }),
});

const { notionPageUrl, title } = await noteResponse.json();

// 4. Show success message with link
alert(`Note created: ${title}\n${notionPageUrl}`);
```

---

## AI Processing Details

### Transcription (Whisper)
- Model: `whisper-1`
- Language: English only (MVP)
- Cost: ~$0.006 per minute of audio

### Polishing (GPT-4o-mini)
The AI performs the following transformations:
1. Removes filler words (um, uh, like, you know, etc.)
2. Fixes grammar and punctuation
3. Organizes text into clear paragraphs
4. Maintains original meaning and tone
5. Generates a concise title (max 60 characters)

- Model: `gpt-4o-mini`
- Cost: ~$0.0001 per note

---

## Notion Setup Requirements

### For Users:
1. Create a Notion integration at https://www.notion.so/my-integrations
2. Copy the "Internal Integration Token" (starts with `secret_`)
3. Share a database with the integration:
   - Open the database in Notion
   - Click "..." menu → "Add connections" → Select your integration
4. Copy the database ID from the URL:
   - Format: `https://notion.so/xxxxx?v=yyyyy`
   - Database ID is the `xxxxx` part

### Database Requirements:
- Must have a `title` property (typically named "Name" or "Title")
- The integration must have write access to the database

---

## Error Handling Best Practices

1. **Always check response status** before parsing JSON
2. **Handle network errors** (server unreachable)
3. **Show user-friendly messages** for common errors:
   - "Unable to transcribe audio. Please try again."
   - "Could not connect to Notion. Please check your API key and database settings."
4. **Log detailed errors** for debugging

### Example Error Handler

```javascript
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Show user-friendly error message
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    if (error.message === 'Network request failed') {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw error;
  }
}
```

---

## Rate Limits & Costs

### Current Limits (MVP)
- No rate limiting implemented
- Reliant on OpenAI API rate limits

### Estimated Costs (per 1000 notes)
- Transcription: ~$12 (assuming 2 min average)
- Polishing: ~$0.10
- **Total: ~$12/1000 notes**

### Production Recommendations
- Implement per-user rate limiting
- Add request queuing for high load
- Monitor OpenAI API costs
- Consider caching for duplicate requests

---

## Development Tips

### Testing with Postman/Insomnia

1. **Test Transcribe:**
   - Method: POST
   - URL: `http://localhost:8080/api/transcribe`
   - Body: form-data
   - Add file field named "audio"

2. **Test Create Note:**
   - Method: POST
   - URL: `http://localhost:8080/api/create-note`
   - Body: raw JSON
   - Include all required fields

### Local Development

```bash
# Start dev server with hot reload
npm run dev

# Build and run production
npm run build
npm run start
```

### Environment Variables

Create a `.env` file:
```env
OPENAI_API_KEY=sk-your-key-here
PORT=8080
```

---

## Support

For issues or questions:
- Check error messages in server logs
- Verify environment variables are set correctly
- Ensure Notion integration has proper permissions
- Confirm audio file is in supported format and under size limit
