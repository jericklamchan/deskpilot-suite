# DeskPilot Suite

> A production-grade, full-stack monorepo combining an intelligent **Model Context Protocol (MCP)** agent backend with a modern **Next.js operations dashboard**. DeskPilot empowers internal operations teams with real-time tool execution, live SSE stream logs, and automated backend workflow routing.

---

## 🏗️ Monorepo Architecture

```text
deskpilot-suite/
├── deskpilot/           # Backend MCP agent server & CLI tools (Node.js, TypeScript, MCP SDK)
└── deskpilot-ui/        # Next.js operations dashboard & SSE client (App Router, Tailwind CSS)
```

---

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, React Client Components.
- **Backend / Agent Core:** Model Context Protocol (MCP) SDK (`@modelcontextprotocol/sdk`), Stdio transport, OpenAI SDK (`openrouter/free`).
- **Communication:** Real-time Server-Sent Events (SSE) streaming architecture bridging Next.js API route handlers to child-process MCP servers.

---

## 🛠️ Core Features

- **Dynamic Tool Discovery:** Automatically inspects and registers MCP backend tools (`manage_task_operations`, `qualify_crm_lead`, `audit_knowledge_base`) upon connection.
- **Real-Time Protocol Streaming:** Live visual execution trace logs via SSE, detailing agent reasoning loops, tool call dispatching, and response generation.
- **Secure Configuration:** Environment-isolated OpenRouter AI integration with robust error-handling guardrails and fallback validation.

---

## ⚙️ Getting Started & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/deskpilot-suite.git
cd deskpilot-suite
```

### 2. Configure Environment Variables
Create a `.env.local` file inside the **`deskpilot-ui/`** directory:
```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
```

### 3. Install Dependencies
Install dependencies for both the frontend dashboard and backend agent server:

```bash
# Install UI dependencies
cd deskpilot-ui
npm install

# Install backend dependencies
cd ../deskpilot
npm install
```

---

## 🚀 Running Locally

1. Navigate to your `deskpilot-ui` directory:
   ```bash
   cd deskpilot-ui
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to launch the DeskPilot operations dashboard.

---

## 🔌 How It Works

1. **Frontend Request:** When you submit a prompt in the Next.js dashboard, a `POST /api/chat` request triggers an App Router SSE endpoint.
2. **Child Process Spawn:** The API route dynamically spawns the backend MCP server (`../deskpilot/server.ts`) via Stdio transport using `npx tsx`.
3. **Tool Handshake:** The client connects to the server, fetches available tools, and feeds them into the OpenRouter model completion loop.
4. **Live Execution Stream:** As the model requests tool calls, the API route executes them on the MCP server and streams execution status, arguments, and results back to the UI in real-time.

---

## 📄 License

This project is licensed under the MIT License.