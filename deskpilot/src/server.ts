import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "../tools/index.js";

async function main() {
  const server = new McpServer({
    name: "deskpilot-mcp-server",
    version: "1.0.0",
  });

  // Register all modular tools
  registerTools(server);

  // Connect via standard I/O transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal MCP Server Error:", err);
  process.exit(1);
});