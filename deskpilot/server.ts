import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "deskpilot-mcp-server",
  version: "1.0.0",
});

// Tool 1: Manage Task Operations
server.registerTool(
  "manage_task_operations",
  {
    description: "Scan team pending tasks and identify incomplete backlogs or operational bottlenecks.",
    inputSchema: z.object({
      userId: z.number().optional().describe("Filter tasks by user ID"),
    }),
  },
  async ({ userId }) => {
    const res = await fetch("https://dummyjson.com/todos?limit=20");
    const data = (await res.json()) as any;
    const pending = data.todos.filter(
      (t: any) => !t.completed && (userId === undefined || t.userId === userId)
    );
    return {
      content: [{ type: "text", text: JSON.stringify(pending, null, 2) }],
    };
  }
);

// Tool 2: Qualify CRM Lead
server.registerTool(
  "qualify_crm_lead",
  {
    description: "Evaluate user lead profile and active shopping cart value from the CRM database.",
    inputSchema: z.object({
      userId: z.number().describe("User ID to look up"),
    }),
  },
  async ({ userId }) => {
    const userRes = await fetch(`https://dummyjson.com/users/${userId}`);
    const cartRes = await fetch(`https://dummyjson.com/carts/user/${userId}`);
    const user = await userRes.json();
    const carts = await cartRes.json();
    return {
      content: [
        { type: "text", text: JSON.stringify({ user, carts }, null, 2) },
      ],
    };
  }
);

// Tool 3: Audit Knowledge Base
server.registerTool(
  "audit_knowledge_base",
  {
    description: "Search internal company posts and discussion threads for topic insights.",
    inputSchema: z.object({
      query: z.string().describe("Search keyword"),
    }),
  },
  async ({ query }) => {
    const res = await fetch(
      `https://dummyjson.com/posts/search?q=${encodeURIComponent(query)}`
    );
    const data = (await res.json()) as any;
    return {
      content: [{ type: "text", text: JSON.stringify(data.posts, null, 2) }],
    };
  }
);

// Connect via standard I/O transport
const transport = new StdioServerTransport();
await server.connect(transport);