# DeskPilot 🚀

**DeskPilot** is an enterprise-grade, decoupled AI operations assistant engineered using the official **Model Context Protocol (MCP)** SDK. 

Acting as an independent MCP Client over `stdio` transport, DeskPilot dynamically discovers and executes server-hosted operational tools—including team task backlog analysis, CRM lead qualification, and internal knowledge base searching—utilizing public REST endpoints and OpenRouter's free-tier LLM routing.

---

## Architecture

DeskPilot uses a modern, multi-process **Client-Server MCP Architecture**:
* **`server.ts`**: An independent MCP Server built on `McpServer` and `StdioServerTransport` that encapsulates tool definitions, Zod validation schemas, and external REST fetching logic.
* **`agent.ts`**: The MCP Client runtime that spawns the server as a child process, dynamically lists available tools via `mcpClient.listTools()`, transforms them into OpenAI tool specifications, and drives an autonomous multi-turn reasoning loop.

```text
+-------------------------------------------------------+
|                      DeskPilot                        |
|                                                       |
|   +-------------------+       stdio       +--------+  |
|   | agent.ts (Client) | <-----------------> | server |  |
|   +-------------------+                     +--------+  |
|             |                                   |     |
|             v                                   v     |
|        OpenRouter API                     DummyJSON APIs|
+-------------------------------------------------------+
```

---

## Tech Stack

* **Language:** TypeScript (ES Modules, `"module": "nodenext"`, strict settings)
* **Runtime:** Node.js with `tsx`
* **AI SDK:** OpenAI SDK configured for OpenRouter (`openrouter/free`)
* **Protocol:** `@modelcontextprotocol/sdk` (MCP)
* **Validation:** Zod
* **Data Sources:** DummyJSON REST Endpoints (`/todos`, `/users`, `/carts`, `/posts/search`)

---

## Project Structure

```text
deskpilot/
├── server.ts         # MCP Server process (tool implementations & schemas)
├── agent.ts          # MCP Client runtime (OpenAI loop & terminal CLI)
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript strict configuration
├── .env              # Environment variables (OpenRouter API key)
└── .gitignore        # Ignored build artifacts and secrets
```

---

## Getting Started

### 1. Prerequisites
Ensure you have **Node.js** installed on your machine.

### 2. Clone and Setup
Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/deskpilot.git
cd deskpilot
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
```

---

## How to Run

Because `agent.ts` automatically spawns `server.ts` as a background process over `stdio`, you only need to run the client script:

```bash
npx tsx agent.ts
```

### Example Commands to Try

Once the CLI prompt appears (`DeskPilot CLI > Enter your command:`), try any of the following queries:

* **Multi-Domain Query:**
  > *Check incomplete tasks for user 5, look up CRM lead details for user 12, and search the knowledge base for posts about 'tech'.*
* **Single Tool (CRM Lead):**
  > *Look up CRM lead details and cart value for user 3.*
* **Single Tool (Backlog Tasks):**
  > *Show me all incomplete pending tasks for user 1.*