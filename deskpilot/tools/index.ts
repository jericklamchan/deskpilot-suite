import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { safeFetchJson } from "../utils/fetcher.js";

export function registerTools(server: McpServer) {
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
      try {
        const res = await safeFetchJson("https://dummyjson.com/todos?limit=20");
        if (!res.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ status: "error", message: res.error }, null, 2),
              },
            ],
          };
        }
        const data = res.data as any;
        const pending = data.todos.filter(
          (t: any) => !t.completed && (userId === undefined || t.userId === userId)
        );
        return {
          content: [{ type: "text", text: JSON.stringify(pending, null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: "fatal_error", message: err.message }, null, 2),
            },
          ],
        };
      }
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
      try {
        const [userRes, cartRes] = await Promise.all([
          safeFetchJson(`https://dummyjson.com/users/${userId}`),
          safeFetchJson(`https://dummyjson.com/carts/user/${userId}`),
        ]);

        if (!userRes.success || !cartRes.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "error",
                    message: "Failed to fetch CRM user or cart data.",
                    userError: userRes.success ? null : userRes.error,
                    cartError: cartRes.success ? null : cartRes.error,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { user: userRes.data, carts: cartRes.data },
                null,
                2
              ),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: "fatal_error", message: err.message }, null, 2),
            },
          ],
        };
      }
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
      try {
        const res = await safeFetchJson(
          `https://dummyjson.com/posts/search?q=${encodeURIComponent(query)}`
        );
        if (!res.success) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ status: "error", message: res.error }, null, 2),
              },
            ],
          };
        }
        const data = res.data as any;
        return {
          content: [{ type: "text", text: JSON.stringify(data.posts ?? [], null, 2) }],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ status: "fatal_error", message: err.message }, null, 2),
            },
          ],
        };
      }
    }
  );
}