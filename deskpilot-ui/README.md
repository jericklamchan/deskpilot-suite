# DeskPilot UI (Dashboard & Streaming Client) 💻

`deskpilot-ui` is a modern Next.js App Router web application that acts as the control panel for the DeskPilot AI Assistant. It bridges user requests to the backend MCP server using dynamic process spawning and real-time Server-Sent Events (SSE).

## ✨ Features

- **Live Protocol Streaming:** Displays real-time SSE execution logs, showing active tool discovery, agent reasoning turns, and payload execution steps.
- **Dynamic MCP Client Integration:** Server-side API routes seamlessly initialize `@modelcontextprotocol/sdk` clients and manage the child process lifecycle of the `deskpilot` backend.
- **Agentic Chat Interface:** Interactive prompt console for issuing complex management, inventory, and task backlog queries.

---

## 🛠️ Project Structure

```text
deskpilot-ui/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts  # Node.js API route (MCP Client & Child Process Manager)
│   ├── layout.tsx        # Root UI Layout
│   └── page.tsx          # Dashboard page & SSE event stream reader
├── .env.local            # Local environment keys (OPENROUTER_API_KEY)
├── package.json          # Dependencies
└── README.md             # Frontend module documentation
```

---

## ⚙️ Configuration & Setup

1. Create a `.env.local` file in the root of `deskpilot-ui/`:

   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Navigate to [http://localhost:3000](http://localhost:3000) to launch the assistant dashboard.