import { NextRequest } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import path from "path";
import dotenv from "dotenv";

// Load environment variables explicitly
dotenv.config();
dotenv.config({ path: ".env.local" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ 
        error: "Configuration Error: OPENROUTER_API_KEY is missing in deskpilot-ui/.env.local" 
      }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
  });

  const { prompt } = await req.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
          );
        } catch (e) {
          console.error("Failed to enqueue event:", e);
        }
      };

      let mcpClient: Client | null = null;

      // Handle client disconnect / abort signals gracefully
      const abortHandler = async () => {
        console.warn("[API Route] Client disconnected. Cleaning up MCP client...");
        if (mcpClient) {
          try {
            await mcpClient.close();
          } catch {}
        }
      };
      req.signal.addEventListener("abort", abortHandler);

      try {
        sendEvent("status", "Initializing MCP Transport & spawning server...");

        const serverPath = path.resolve(process.cwd(), "../deskpilot/server.ts");
        const deskpilotDir = path.resolve(process.cwd(), "../deskpilot");

        console.log("[MCP Spawn] Server script path:", serverPath);
        console.log("[MCP Spawn] Working directory:", deskpilotDir);

        const transport = new StdioClientTransport({
          command: "npx",
          args: ["tsx", serverPath],
          cwd: deskpilotDir, // <--- THIS IS THE FIX: Runs it inside the deskpilot package folder
        });

        mcpClient = new Client(
          { name: "deskpilot-nextjs-client", version: "1.0.0" },
          { capabilities: {} }
        );

        await mcpClient.connect(transport);
        sendEvent("status", "Connected to MCP Server successfully.");

        // Discover tools
        const mcpToolsResult = await mcpClient.listTools();
        const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = mcpToolsResult.tools.map(
          (tool) =>
            ({
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

        sendEvent(
          "tools_discovered",
          tools.map((t) => ("function" in t ? t.function.name : ""))
        );

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          {
            role: "system",
            content:
              "You are DeskPilot, an internal operations assistant. Use your tools to fetch data from team backlogs, CRM leads, and knowledge bases to answer management requests with clear reports.",
          },
          { role: "user", content: prompt },
        ];

        let isLoopActive = true;
        let maxTurns = 5;

        while (isLoopActive && maxTurns > 0) {
          maxTurns--;

          console.log(`[Agent Loop] Requesting completion from OpenRouter (Turns remaining: ${maxTurns})...`);

          let response;
          try {
            response = await openai.chat.completions.create({
              model: "openrouter/free",
              messages,
              tools,
              tool_choice: "auto",
            });
          } catch (apiErr: any) {
            console.error("[OpenRouter API Error]", apiErr);
            sendEvent("error", `OpenRouter API Call failed: ${apiErr.message}`);
            break;
          }

          console.log("[Agent Loop] Received model response.");

          const assistantMessage = response.choices[0]?.message;
          if (!assistantMessage) {
            console.error("[Agent Error] Empty choice payload returned.");
            sendEvent("error", "No response message received from OpenRouter.");
            break;
          }

          messages.push(assistantMessage);

          if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            console.log(`[Agent Loop] Processing ${assistantMessage.tool_calls.length} tool call(s)...`);

            for (const toolCall of assistantMessage.tool_calls) {
              if (toolCall.type === "function") {
                const fnName = toolCall.function.name;
                const fnArgs = JSON.parse(toolCall.function.arguments ?? "{}");

                sendEvent("tool_call_start", { name: fnName, args: fnArgs });

                console.log(`[MCP Call] Invoking '${fnName}' on MCP Server...`, fnArgs);
                const toolExecutionResult = await mcpClient.callTool({
                  name: fnName,
                  arguments: fnArgs,
                });

                const contentBlocks = (toolExecutionResult.content ?? []) as Array<{
                  type: string;
                  text?: string;
                }>;
                const resultText = contentBlocks
                  .map((item) => (item.type === "text" ? item.text ?? "" : ""))
                  .join("\n");

                sendEvent("tool_call_complete", {
                  name: fnName,
                  resultSnippet: resultText.slice(0, 200) + "...",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: resultText,
                });
              }
            }
          } else {
            isLoopActive = false;
            console.log("[Agent Loop] Received final answer from assistant.");
            sendEvent("final_answer", assistantMessage.content ?? "No text response content.");
          }
        }
      } catch (fatalErr: any) {
        console.error("[Fatal Stream Error]", fatalErr);
        sendEvent("error", `Fatal Error: ${fatalErr.message}`);
      } finally {
        req.signal.removeEventListener("abort", abortHandler);
        if (mcpClient) {
          try {
            await mcpClient.close();
          } catch (closeErr) {
            console.error("Error closing MCP client:", closeErr);
          }
        }
        sendEvent("status", "Stream finished.");
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}