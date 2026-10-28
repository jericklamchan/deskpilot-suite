# DeskPilot Suite 🚀

DeskPilot Suite is a full-stack, monorepo-based AI operations assistant platform. It leverages the **Model Context Protocol (MCP)** to allow an LLM agent to inspect, query, and act upon mock internal enterprise data (CRM, Inventory, Task Backlogs) in real time.

## 🏗️ Architecture Overview

The workspace is organized as a monorepo containing two core modules:

```text
deskpilot-suite/
├── deskpilot/       # MCP Backend Server (TypeScript + Stdio Transport)
├── deskpilot-ui/    # Next.js Dashboard Frontend (React + SSE Stream)
└── README.md        # Monorepo documentation
```

### Protocol & Lifecycle Flow
1. **Frontend Request:** The Next.js dashboard (`deskpilot-ui`) dispatches a prompt payload to `/api/chat`.
2. **MCP Client & Child Process:** The API route initializes an `@modelcontextprotocol/sdk` client and spawns `deskpilot/server.ts` via standard input/output (`StdioClientTransport`) using the backend directory `cwd`.
3. **Tool Discovery:** The MCP client queries the backend for registered tools (`/products`, `/users`, `/todos`) and transforms schemas into OpenAI function declarations.
4. **Agentic Loop:** OpenRouter processes user inputs, calls appropriate tools via MCP JSON-RPC, receives execution results, and formulates final responses.
5. **Streaming Response:** Server-Sent Events (SSE) stream status updates, tool initiation/completion events, and the final LLM output back to the React UI in real time.

---

## 🛠️ Tech Stack

- **Frameworks:** Next.js (App Router), Node.js, React, TypeScript
- **Protocols:** Model Context Protocol (MCP), JSON-RPC over `stdio`, Server-Sent Events (SSE)
- **AI Infrastructure:** `@modelcontextprotocol/sdk`, OpenRouter API, OpenAI SDK
- **Styling & UI:** Tailwind CSS, Lucide Icons

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd deskpilot-suite

# Install backend dependencies
cd deskpilot && npm install

# Install frontend dependencies
cd ../deskpilot-ui && npm install
```

### 2. Environment Configuration

Create a `.env.local` file inside `deskpilot-ui/`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Running the Application

Start the Next.js development server:

```bash
cd deskpilot-ui
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with DeskPilot.