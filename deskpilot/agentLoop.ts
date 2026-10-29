import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import OpenAI from "openai";
import { openai } from "./config.js";

export async function runAgent(
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
    const assistantMessage = choice?.message;
    if (!assistantMessage) {
      console.error("Received empty message payload from OpenRouter.");
      break;
    }

    messages.push(assistantMessage);

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type === "function") {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(
            toolCall.function.arguments ?? "{}"
          ) as Record<string, any>;

          console.log(`\n[MCP Client Call] Executing '${fnName}' via Protocol...`, fnArgs);

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