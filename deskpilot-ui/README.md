# DeskPilot UI

> The frontend dashboard and real-time execution console for the **DeskPilot Suite**. Built with Next.js (App Router), TypeScript, and Tailwind CSS, it connects directly to the `deskpilot` MCP backend via Server-Sent Events (SSE).

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19 / Client Components)
- **Styling:** Tailwind CSS
- **Protocol & Transport:** Server-Sent Events (SSE) streaming bridging App Router API routes (`app/api/chat/route.ts`) to child-process backend instances (`deskpilot`).
- **Process Lifecycle Management:** Built-in `AbortController` signal tracking to prevent background zombie process leaks on client disconnect.

---

## 📂 Project Structure

```text
deskpilot-ui/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts     # Main SSE endpoint spawning & streaming MCP backend process
│   ├── layout.tsx           # Global app layout & metadata
│   └── page.tsx             # Operations dashboard UI & chat interface
├── components/              # UI components (log streaming, message UI, control panels)
├── public/                  # Static assets
├── .env.local               # Local environment key configuration (git-ignored)
├── next.config.ts           # Next.js configuration
├── package.json             # Frontend dependencies & scripts
└── tsconfig.json            # TypeScript setup
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) installed and that the sibling folder `deskpilot` contains the runnable TypeScript backend MCP server (`server.ts`).

### 2. Configure Environment Variables
Create a `.env.local` file inside the `deskpilot-ui/` directory:

```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### 3. Install Dependencies
Run from inside the `deskpilot-ui` directory:

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to launch the dashboard.

---

## ⚡ API & Backend Integration

The primary interaction happens through the API route located at `app/api/chat/route.ts`:

1. **Child Process Spawning:** Upon receiving a request, Next.js spawns `npx tsx ../deskpilot/server.ts` using `child_process.spawn`.
2. **Real-time SSE Logs:** Stdout from the MCP agent is encoded and streamed directly back to the React UI as Server-Sent Events.
3. **Stderr Capture:** Terminal error output from the backend is captured in real-time to prevent silent failures.
4. **Lifecycle Hooks:** Listens to `req.signal` (`abort`) events. If the tab or client connection drops mid-request, a `SIGTERM` / `SIGKILL` cascade immediately terminates the backend process.

---

## 📄 License

This project is part of the **DeskPilot Suite** monorepo and is licensed under the MIT License.