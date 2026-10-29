# DeskPilot MCP Backend

The backend core of **DeskPilot**, built on top of the **Model Context Protocol (MCP)**. This package provides a decoupled MCP server containing operational tools (Tasks, CRM Leads, and Knowledge Base search) along with a standalone CLI agent runner powered by OpenRouter.

---

## 📂 Backend Architecture

```
deskpilot/
├── config.ts         # Environment configuration and OpenAI client setup
├── mcpClient.ts      # MCP Stdio transport connection & dynamic tool mapping
├── agentLoop.ts      # Multi-turn LLM reasoning & tool execution loop
├── agent.ts          # Terminal CLI entry point for testing the agent
├── server.ts         # Standalone Model Context Protocol (MCP) Server
├── utils/
│   └── fetcher.ts    # Resilient HTTP fetcher with timeout guards
└── tools/
    └── index.ts      # Registered operational tools (Tasks, CRM, Knowledge Base)
```

---

## ⚙️ Configuration & Environment

1. Navigate to the `deskpilot` directory:
   ```bash
   cd deskpilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `deskpilot/` directory:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

> **Note on Module Resolution:** This project uses ECMAScript modules (`nodenext` / `node16`). Relative imports within TypeScript source files require explicit file extensions (e.g., `./config.js`).

---

## 🛠️ Operational Tools Included

The MCP Server (`server.ts`) registers three core operational tools:

1. `manage_task_operations`: Fetches pending team tasks and identifies operational bottlenecks.
2. `qualify_crm_lead`: Evaluates user lead profiles and active shopping cart values.
3. `audit_knowledge_base`: Searches company posts and internal discussion threads.

---

## 🧪 Testing the Backend

### 1. Interactive CLI Agent Runner
Run the standalone CLI agent directly in your terminal to test full agent loops over Stdio transport:

```bash
npx tsx agent.ts
```

**Example Prompts to Try:**
* `"Check all pending team tasks and summarize the current operational backlogs."`
* `"Qualify CRM lead for user ID 5 by checking their profile details and active shopping cart items."`
* `"Search our internal knowledge base for any discussion threads or posts related to 'history'."`

### 2. Standalone MCP Inspector
Use Anthropic's official MCP Inspector to interactively test tools, inspect schemas, and verify raw JSON outputs via a web UI:

```bash
npx @modelcontextprotocol/inspector npx tsx server.ts
```