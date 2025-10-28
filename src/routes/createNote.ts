import { Request, Response } from "express";
import OpenAI from "openai";
import { Client } from "@notionhq/client";

// Prompt for GPT-4o-mini to polish transcriptions
const POLISHING_PROMPT = `You are a text editor that polishes voice transcriptions. Your task is to:
1. Remove filler words (um, uh, like, you know, etc.)
2. Fix grammar and punctuation
3. Organize the text into clear, well-structured paragraphs
4. Maintain the original meaning and tone
5. Keep the text natural and conversational

Return ONLY the polished text, without any preamble or explanation.`;

const TITLE_PROMPT = `Based on the following text, generate a concise, descriptive title (maximum 60 characters). Return ONLY the title text, nothing else:`;

/**
 * Create a note in Notion with polished transcription
 * Handler for POST /api/create-note
 */
export const createNote = async (req: Request, res: Response) => {
  try {
    const { transcription, notionApiKey, notionDatabaseId } = req.body;

    // Validate required fields
    if (!transcription) {
      return res.status(400).json({
        error: "Missing required field",
        message: "Transcription text is required",
      });
    }

    if (!notionApiKey) {
      return res.status(400).json({
        error: "Missing required field",
        message: "Notion API key is required",
      });
    }

    if (!notionDatabaseId) {
      return res.status(400).json({
        error: "Missing required field",
        message: "Notion Database ID is required",
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

    console.log("Polishing transcription with GPT-4o-mini...");

    // Polish the transcription using GPT-4o-mini
    const polishingResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: POLISHING_PROMPT },
        { role: "user", content: transcription },
      ],
      temperature: 0.7,
    });

    const polishedText = polishingResponse.choices[0]?.message?.content || transcription;

    console.log("Generating title...");

    // Generate a title based on the polished content
    const titleResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: TITLE_PROMPT },
        { role: "user", content: polishedText },
      ],
      temperature: 0.7,
      max_tokens: 20,
    });

    const title = titleResponse.choices[0]?.message?.content?.trim() || "Voice Note";

    console.log(`Creating Notion page with title: "${title}"`);

    // Initialize Notion client with user-provided API key
    const notion = new Client({
      auth: notionApiKey,
    });

    // Create the page in Notion
    const page = await notion.pages.create({
      parent: {
        database_id: notionDatabaseId,
      },
      properties: {
        // Title property (most databases have this as "Name" or "Title")
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        // Add timestamp if the database has a "Created" property
        // This is optional and will be ignored if the property doesn't exist
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: polishedText,
                },
              },
            ],
          },
        },
      ],
    });

    console.log("Notion page created successfully");

    // Return success with page URL
    return res.json({
      success: true,
      notionPageUrl: (page as any).url,
      title: title,
      polishedText: polishedText,
    });
  } catch (error: any) {
    console.error("Create note error:", error);

    // Handle Notion API errors
    if (error.code === "unauthorized") {
      return res.status(401).json({
        error: "Notion authentication failed",
        message: "Invalid Notion API key. Please check your integration token.",
      });
    }

    if (error.code === "object_not_found") {
      return res.status(404).json({
        error: "Notion database not found",
        message: "The specified database ID was not found or the integration doesn't have access to it.",
      });
    }

    if (error.code === "validation_error") {
      return res.status(400).json({
        error: "Notion validation error",
        message: error.message || "The database structure may not match expected properties.",
      });
    }

    // Handle OpenAI API errors
    if (error.response?.status) {
      return res.status(error.response.status).json({
        error: "AI processing failed",
        message: error.response.data?.error?.message || "Failed to polish transcription",
      });
    }

    // Handle other errors
    return res.status(500).json({
      error: "Failed to create note",
      message: error.message || "An unexpected error occurred",
    });
  }
};
