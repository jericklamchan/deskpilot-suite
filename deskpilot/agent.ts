import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function main() {
  // 1. Initialize MCP Stdio Transport to launch server.ts as a child process
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "server.ts"],
  });

  const mcpClient = new Client(
    { name: "deskpilot-agent-client", version: "1.0.0" },
    { capabilities: {} }
  );

  console.log("Connecting to DeskPilot MCP Server...");
  await mcpClient.connect(transport);
  console.log("Connected successfully over stdio.\n");

  // 2. Dynamic Tool Discovery via MCP Protocol
  const mcpToolsResult = await mcpClient.listTools();
  
  // Map and typecast native MCP tool specifications into standard OpenAI function tools
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

  console.log(
    `[MCP Discovery] Dynamically loaded ${tools.length} tools from server:`
  );
  tools.forEach((t) => {
    if ("function" in t) {
      console.log(`  - ${t.function.name}`);
    }
  });

  // 3. User Interaction CLI setup
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("\nDeskPilot CLI > Enter your command: ", async (userPrompt) => {
    await runAgent(userPrompt, mcpClient, tools);
    rl.close();
    await mcpClient.close();
    process.exit(0);
  });
}

async function runAgent(
  userPrompt: string,
  mcpClient: Client,
  tools: OpenAI.Chat.Completions.ChatCompletionTool[]
) {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are DeskPilot, an internal operations assistant. Use your tools to fetch data from team backlogs, CRM leads, and knowledge bases to answer management requests with clear reports.",
    },
    { role: "user", content: userPrompt },
  ];

  let isLoopActive = true;
  let maxTurns = 5;

  while (isLoopActive && maxTurns > 0) {
    maxTurns--;

    const response = await openai.chat.completions.create({
      model: "openrouter/free",
      messages,
      tools,
      tool_choice: "auto",
    });

    const choices = response.choices;
    if (!choices || choices.length === 0) {
      console.error("Received empty response choices from OpenRouter.");
      break;
    }

    const choice = choices[0];
    if (!choice || !choice.message) {
      console.error("Received empty message payload from OpenRouter.");
      break;
    }

    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type === "function") {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(
            toolCall.function.arguments ?? "{}"
          ) as Record<string, any>;

          console.log(`\n[MCP Client Call] Executing '${fnName}' via Protocol...`, fnArgs);

          // Execute tool directly through the MCP Client connection
          const toolExecutionResult = await mcpClient.callTool({
            name: fnName,
            arguments: fnArgs,
          });

          // Safely typecast content blocks to resolve 'unknown' typescript checks
          const contentBlocks = (toolExecutionResult.content ?? []) as Array<{
            type: string;
            text?: string;
          }>;

          // Serialize content array returned by MCP server
          const resultText = contentBlocks
            .map((item) => (item.type === "text" ? item.text ?? "" : ""))
            .join("\n");

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultText,
          });
        }
      }
    } else {
      isLoopActive = false;
      console.log("\n--- DeskPilot Executive Summary ---");
      console.log(assistantMessage.content);
    }
  }
}

main().catch((err) => {
  console.error("Fatal Agent Error:", err);
  process.exit(1);
});