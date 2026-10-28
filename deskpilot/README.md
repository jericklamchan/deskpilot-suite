# DeskPilot MCP Backend Server ⚙️

This directory contains the core Model Context Protocol (MCP) server for the DeskPilot Suite. It exposes internal mock APIs (powered by DummyJSON) as standard MCP tools over a `stdio` JSON-RPC transport.

## 📦 Features & Capabilities

The server registers three primary domain tools that can be dynamically discovered and invoked by any compatible MCP client:

1. **`get_products`** (E-Commerce & Inventory Management)
   - Fetches product stock levels, pricing, categories, and inventory metrics from `/products`.
2. **`get_users`** (CRM & Customer Profiles)
   - Fetches customer data, contact profiles, user roles, and account statuses from `/users`.
3. **`get_todos`** (Operations & Backlog Tracking)
   - Fetches team task lists, completion statuses, and operational backlogs from `/todos`.

---

## 🛠️ Project Structure

```text
deskpilot/
├── server.ts        # Primary MCP Server implementation & tool definitions
├── package.json     # Node dependencies and execution scripts
├── tsconfig.json   # TypeScript configuration
└── README.md        # Backend module documentation
```

---

## 🧪 Independent Testing & Execution

Because this is a `stdio`-based MCP server, running it directly will listen quietly on `stdin` for JSON-RPC messages:

```bash
# Run using tsx
npx tsx server.ts
```

When connected to a client (such as `deskpilot-ui` or the MCP Inspector), the server handles handshake initializations, tool schema reporting, and execution routing.