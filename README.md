# DeskPilot Enterprise Suite

DeskPilot Enterprise Suite is a production-ready, modular AI operations platform powered by the **Model Context Protocol (MCP)**. It combines a decoupled backend MCP server with a real-time Next.js frontend UI featuring Server-Sent Events (SSE) streaming, request idempotency tracking, and interactive tool execution.

---

## 📂 Monorepo Architecture

```text
deskpilot-suite/
├── deskpilot/                  # MCP Backend & Interactive CLI Agent
│   ├── config.ts               # Environment & OpenRouter LLM client configuration
│   ├── mcpClient.ts            # MCP Stdio transport & dynamic tool discovery
│   ├── agentLoop.ts            # Multi-turn LLM reasoning & execution loop
│   ├── agent.ts                # Terminal CLI entry point for testing
│   ├── server.ts               # Standalone MCP Server backbone
│   ├── utils/
│   │   └── fetcher.ts          # Resilient HTTP fetcher with timeout guards
│   └── tools/
│       └── index.ts            # Registered operational tools (Tasks, CRM, KB)
│
└── deskpilot-ui/               # Next.js Frontend Operations Dashboard
    ├── app/
    │   ├── api/
    │   │   ├── chat/route.ts   # SSE streaming API spawning MCP child process
    │   │   └── key-status/     # OpenRouter API key quota verification
    │   ├── components/         # Modular UI sub-components
    │   │   ├── Header.tsx
    │   │   ├── PromptForm.tsx
    │   │   ├── ProtocolLogs.tsx
    │   │   └── ExecutiveSummary.tsx
    │   ├── hooks/
    │   │   └── useDeskPilotSession.ts  # Custom state, SSE & storage hook
    │   ├── types/
    │   │   └── index.ts        # TypeScript data models
    │   └── page.tsx            # Main container page
    └── package.json
```

---

## ⚙️ Prerequisites & Environment Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **OpenRouter API Key**: Required for LLM reasoning capabilities

### Environment Configuration

Create environment configuration files in both packages:

1. **Backend Configuration (`deskpilot/.env`):**
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

2. **Frontend Configuration (`deskpilot-ui/.env.local`):**
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies

Install packages in both monorepo workspaces:

```bash
# Install backend dependencies
cd deskpilot && npm install

# Install frontend dependencies
cd ../deskpilot-ui && npm install
```

---

## 🧪 Testing the Backend Standalone

You can test the MCP backend independently without spawning the frontend interface.

### Method A: Interactive Terminal CLI
Run the interactive CLI agent runner over Stdio:
```bash
cd deskpilot
npx tsx agent.ts
```

### Method B: Anthropic MCP Inspector
Launch Anthropic's official MCP Inspector web UI to test schemas and payloads:
```bash
cd deskpilot
npx @modelcontextprotocol/inspector npx tsx server.ts
```

---

## 🌐 Running the Frontend UI

Start the Next.js development server:

```bash
cd deskpilot-ui
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the DeskPilot Operations Hub.

---

## 🔒 Key Features

- **Decoupled MCP Architecture**: Standardized protocol connection via Stdio child processes.
- **Real-Time Streaming**: Server-Sent Events (SSE) deliver live execution protocol logs and token metrics.
- **Idempotency Tracking**: Every execution includes a unique `X-Idempotency-Key` header to prevent duplicate calls.
- **Session Persistence**: Local state (`logs`, `summary`, `tokens`) automatically persists across reloads via `localStorage`.
- **Clean Code & Modular Standards**: Built with modern ESM extension rules (`.js`), clean React custom hooks, and full TypeScript typing.