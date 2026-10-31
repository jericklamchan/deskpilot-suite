// deskpilot/src/mcpClient.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import { MCP_SERVER_PATH, CLIENT_INFO } from "./config.js";

export async function createMcpClient() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", MCP_SERVER_PATH],
  });

  const mcpClient = new Client(
    { name: CLIENT_INFO.name, version: CLIENT_INFO.version },
    { capabilities: {} }
  );

  console.log("Connecting to DeskPilot MCP Server...");
  await mcpClient.connect(transport);
  console.log("Connected successfully over stdio.\n");

  return mcpClient;
}

export async function discoverTools(mcpClient: Client): Promise<OpenAI.Chat.Completions.ChatCompletionTool[]> {
  const mcpToolsResult = await mcpClient.listTools();

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = mcpToolsResult.tools.map(
    (tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description ?? "",
        parameters: (tool.inputSchema as Record<string, any>) ?? {
          type: "object",
          properties: {},
        },
      },
    } as OpenAI.Chat.Completions.ChatCompletionFunctionTool)
  );

  console.log(`[MCP Discovery] Dynamically loaded ${tools.length} tools from server:`);
  tools.forEach((t) => {
    if ("function" in t) {
      console.log(`  - ${t.function.name}`);
    }
  });

  return tools;
}