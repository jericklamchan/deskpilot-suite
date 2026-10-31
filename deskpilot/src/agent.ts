import readline from "readline";
import { createMcpClient, discoverTools } from "./mcpClient.js";
import { runAgent } from "./agentLoop.js";

async function main() {
  const mcpClient = await createMcpClient();
  const tools = await discoverTools(mcpClient);

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

main().catch((err) => {
  console.error("Fatal Agent Error:", err);
  process.exit(1);
});