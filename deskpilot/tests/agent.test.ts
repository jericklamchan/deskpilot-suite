// deskpilot/tests/agent.test.ts
import { createMcpClient, discoverTools } from "../src/mcpClient.js";
import { runAgent } from "../src/agentLoop.js";

async function testGrokIntegration() {
  console.log("Initializing MCP Client for testing...");
  const mcpClient = await createMcpClient();
  const tools = await discoverTools(mcpClient);

  console.log("\nTesting agent loop with OpenRouter Free model...");
  await runAgent(
    "Fetch our current backlog tasks using your task tool to verify execution.",
    mcpClient,
    tools,
    "openrouter/free" // Using active free routing
  );

  process.exit(0);
}

testGrokIntegration().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});