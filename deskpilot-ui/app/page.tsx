"use client";
import React, { useState } from "react";

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLogs([]);
    setResult("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "");
          if (dataStr === "[DONE]") {
            setLoading(false);
            break;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "status") {
              setLogs((prev) => [...prev, `[System] ${parsed.data}`]);
            } else if (parsed.type === "tools_discovered") {
              setLogs((prev) => [...prev, `[MCP] Discovered tools: ${parsed.data.join(", ")}`]);
            } else if (parsed.type === "tool_call_start") {
              setLogs((prev) => [...prev, `[Protocol] Executing tool '${parsed.data.name}' with args: ${JSON.stringify(parsed.data.args)}`]);
            } else if (parsed.type === "tool_call_complete") {
              setLogs((prev) => [...prev, `[Success] Tool '${parsed.data.name}' executed.`]);
            } else if (parsed.type === "final_answer") {
              setResult(parsed.data);
            }
          } catch (err) {
            // ignore JSON parse errors on partial frames
          }
        }
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-400">DeskPilot Operations Hub</h1>
            <p className="text-sm text-slate-400">Decoupled Model Context Protocol (MCP) Enterprise Agent</p>
          </div>
          <span className="px-3 py-1 text-xs bg-indigo-950 text-indigo-300 rounded-full border border-indigo-800">
            SSE Active Stream
          </span>
        </header>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Check incomplete tasks for user 5 and look up CRM lead details for user 12..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition"
          >
            {loading ? "Processing..." : "Run Agent"}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Execution Logs */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Live Protocol Logs</h2>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-900">
              {logs.length === 0 && <span className="text-slate-600">Awaiting execution stream...</span>}
              {logs.map((log, idx) => (
                <div key={idx} className="text-emerald-400">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary Output */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Executive Summary</h2>
            <div className="flex-1 overflow-y-auto text-sm text-slate-200 bg-slate-950 p-4 rounded-lg border border-slate-900 whitespace-pre-wrap">
              {result || <span className="text-slate-600">Final report will stream here...</span>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}