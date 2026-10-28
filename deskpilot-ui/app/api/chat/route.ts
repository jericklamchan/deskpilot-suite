import { NextRequest } from "next/server";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory idempotency cache (stores cached results for 5 minutes)
const idempotencyCache = new Map<string, { result: string; tokens: any; timestamp: number }>();

// 15-second tool execution timeout guard
async function callToolWithTimeout(
  mcpClient: Client,
  name: string,
  args: any,
  timeoutMs = 15000
) {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Tool '${name}' execution timed out after ${timeoutMs / 1000}s.`)),
      timeoutMs
    );
  });

  try {
    const result = (await Promise.race([
      mcpClient.callTool({ name, arguments: args }),
      timeoutPromise,
    ])) as any;
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Configuration Error: OPENROUTER_API_KEY is missing in deskpilot-ui/.env.local",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Idempotency check
  const idempotencyKey = req.headers.get("x-idempotency-key");
  if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
    const cached = idempotencyCache.get(idempotencyKey)!;
    if (Date.now() - cached.timestamp < 300000) {
      // Stream back cached response immediately
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "status", data: "[Cache] Serving idempotency-cached execution." })}\n\n`
            )
          );
          if (cached.tokens) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "usage", data: cached.tokens })}\n\n`)
            );
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "final_answer", data: cached.result })}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream" },
      });
    } else {
      idempotencyCache.delete(idempotencyKey);
    }
  }

  let prompt: string;
  try {
    const body = await req.json();
    prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Property 'prompt' is required and must be a string." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON request body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
  });

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
      let totalPromptTokens = 0;
      let totalCompletionTokens = 0;
      let finalAnswerText = "";

      const abortHandler = async () => {
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

        const transport = new StdioClientTransport({
          command: "npx",
          args: ["tsx", serverPath],
          cwd: deskpilotDir,
        });

        mcpClient = new Client(
          { name: "deskpilot-nextjs-client", version: "1.0.0" },
          { capabilities: {} }
        );

        await mcpClient.connect(transport);
        sendEvent("status", "Connected to MCP Server successfully.");

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

          if (response.usage) {
            totalPromptTokens += response.usage.prompt_tokens || 0;
            totalCompletionTokens += response.usage.completion_tokens || 0;

            sendEvent("usage", {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens: totalPromptTokens + totalCompletionTokens,
            });
          }

          const assistantMessage = response.choices[0]?.message;
          if (!assistantMessage) {
            sendEvent("error", "No response message received from OpenRouter.");
            break;
          }

          messages.push(assistantMessage);

          if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            for (const toolCall of assistantMessage.tool_calls) {
              if (toolCall.type === "function") {
                const fnName = toolCall.function.name;
                const fnArgs = JSON.parse(toolCall.function.arguments ?? "{}");

                sendEvent("tool_call_start", { name: fnName, args: fnArgs });

                let toolExecutionResult;
                try {
                  toolExecutionResult = await callToolWithTimeout(mcpClient, fnName, fnArgs, 15000);
                  sendEvent("tool_call_complete", {
                    name: fnName,
                    resultSnippet: "Tool executed successfully within timeout window.",
                  });
                } catch (timeoutErr: any) {
                  sendEvent("error", timeoutErr.message);
                  toolExecutionResult = {
                    content: [
                      {
                        type: "text",
                        text: JSON.stringify({ status: "error", message: timeoutErr.message }),
                      },
                    ],
                  };
                }

                const contentBlocks = (toolExecutionResult.content ?? []) as Array<{
                  type: string;
                  text?: string;
                }>;
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
            finalAnswerText = assistantMessage.content ?? "No text response content.";
            sendEvent("final_answer", finalAnswerText);
          }
        }

        // Save execution to idempotency cache if key present
        if (idempotencyKey && finalAnswerText) {
          idempotencyCache.set(idempotencyKey, {
            result: finalAnswerText,
            tokens: {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens: totalPromptTokens + totalCompletionTokens,
            },
            timestamp: Date.now(),
          });
        }
      } catch (fatalErr: any) {
        console.error("[Fatal Stream Error]", fatalErr);
        sendEvent("error", `Fatal Error: ${fatalErr.message}`);
      } finally {
        req.signal.removeEventListener("abort", abortHandler);
        if (mcpClient) {
          try {
            await mcpClient.close();
          } catch {}
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