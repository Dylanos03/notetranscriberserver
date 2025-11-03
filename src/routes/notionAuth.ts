import { Request, Response } from "express";

/**
 * Handle Notion OAuth callback
 * Handler for GET /api/notion/callback
 *
 * This endpoint receives the authorization code from Notion OAuth flow
 * and exchanges it for an access token.
 */
export const notionCallback = async (req: Request, res: Response) => {
  try {
    const { code, error } = req.query;

    // Check if user denied authorization
    if (error) {
      return res.status(400).json({
        error: "Authorization denied",
        message: error,
      });
    }

    // Validate that we received a code
    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Missing authorization code",
        message: "No authorization code received from Notion",
      });
    }

    // Check if Notion OAuth credentials are configured
    if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Notion OAuth credentials are not configured",
      });
    }

    const redirectUri = process.env.NOTION_REDIRECT_URI || `http://localhost:${process.env.PORT || 8080}/api/notion/callback`;

    console.log("Exchanging authorization code for access token...");

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      return res.status(tokenResponse.status).json({
        error: "Token exchange failed",
        message: errorData.error_description || errorData.error || "Failed to exchange authorization code",
      });
    }

    const tokenData = await tokenResponse.json();

    console.log("Access token obtained successfully");

    // Return the access token and workspace info to the client
    // In a production app, you might want to store this in a database
    // and return a session token instead
    return res.json({
      success: true,
      access_token: tokenData.access_token,
      workspace_id: tokenData.workspace_id,
      workspace_name: tokenData.workspace_name,
      workspace_icon: tokenData.workspace_icon,
      bot_id: tokenData.bot_id,
      owner: tokenData.owner,
      duplicated_template_id: tokenData.duplicated_template_id,
    });

  } catch (error: any) {
    console.error("Notion OAuth callback error:", error);
    return res.status(500).json({
      error: "OAuth callback failed",
      message: error.message || "An unexpected error occurred during OAuth callback",
    });
  }
};
