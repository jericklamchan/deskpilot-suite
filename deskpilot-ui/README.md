# DeskPilot UI

The web dashboard and frontend interface for **DeskPilot**, built with **Next.js (App Router)**, **Tailwind CSS**, and **TypeScript**. It provides a real-time operational dashboard for interacting with the decoupled DeskPilot MCP backend agent.

---

## 📂 Architecture & Directory Structure

```text
deskpilot-ui/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # SSE streaming route spawning MCP backend agent
│   │   └── key-status/route.ts # OpenRouter key status & quota verification
│   ├── components/             # Modular React UI components
│   │   ├── Header.tsx          # Status badges, token counters, session actions
│   │   ├── PromptForm.tsx      # Execution prompt form input
│   │   ├── ProtocolLogs.tsx    # Live protocol stream log viewer
│   │   └── ExecutiveSummary.tsx# Markdown / formatted final answer viewer
│   ├── hooks/
│   │   └── useDeskPilotSession.ts # Custom hook handling SSE stream, storage & state
│   ├── types/
│   │   └── index.ts            # Data models & interface declarations
│   ├── layout.tsx              # Root layout & font configuration
│   └── page.tsx                # Clean container page orchestrating components
├── public/                     # Static assets
└── package.json
```

---

## ⚡ Key Features

- **Server-Sent Events (SSE) Streaming:** Streams real-time MCP discovery, tool execution logs, token usage, and final answers from the backend.
- **Request Idempotency:** Injects a unique `X-Idempotency-Key` UUID header with every execution request to prevent duplicate processing.
- **Session State Persistence:** Remembers prompt history, active logs, final summaries, token totals, and run counts via `localStorage`.
- **OpenRouter Key Monitoring:** Verifies active API key status, tier limits, and token usage via `/api/key-status`.
- **Modular Component Architecture:** Clean separation between custom hooks, state management, single-responsibility components, and strong TypeScript models.

---

## ⚙️ Configuration & Setup

### 1. Environment File

Create a `.env.local` file inside the `deskpilot-ui/` directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. Install Dependencies

```bash
cd deskpilot-ui
npm install
```

---

## 🚀 Running the Frontend

### Development Mode

Start the Next.js development server with hot-reloading:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

To test or deploy a production build:

```bash
npm run build
npm run start
```

---

## 📡 API Integration Details

- **`POST /api/chat`**: Spawns the backend MCP agent child process over `stdio`, parses SSE data chunks, and relays real-time protocol status events to the UI.
- **`GET /api/key-status`**: Fetches key metadata and usage statistics from OpenRouter.