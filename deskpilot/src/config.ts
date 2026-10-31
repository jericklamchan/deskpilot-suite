import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  throw new Error("Configuration Error: OPENROUTER_API_KEY is missing in environment variables.");
}

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "DeskPilot",
  },
});

// Centralized path and client configurations
export const MCP_SERVER_PATH = path.resolve(process.cwd(), "src/server.ts");

export const CLIENT_INFO = {
  name: "deskpilot-agent-client",
  version: "1.0.0",
} as const;

export const SERVER_INFO = {
  name: "deskpilot-mcp-server",
  version: "1.0.0",
} as const;

// Default zero-cost fallback model
export const DEFAULT_MODEL_ID = "openrouter/free";