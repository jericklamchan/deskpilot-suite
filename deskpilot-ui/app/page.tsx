"use client";
import React, { useState, useEffect } from "react";

interface KeyInfo {
  label?: string;
  usage?: number;
  limit?: number | null;
  is_free_tier?: boolean;
}

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  // 1. Fetch OpenRouter Key Status on mount
  const fetchKeyStatus = async () => {
    try {
      const res = await fetch("/api/key-status");
      if (res.ok) {
        const payload = await res.json();
        if (payload.data) {
          setKeyInfo(payload.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch key status:", e);
    }
  };

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  // 2. Restore state from localStorage on initial load
  useEffect(() => {
    const savedPrompt = localStorage.getItem("deskpilot_prompt");
    const savedLogs = localStorage.getItem("deskpilot_logs");
    const savedResult = localStorage.getItem("deskpilot_result");
    const savedTokens = localStorage.getItem("deskpilot_tokens");
    const savedReqCount = localStorage.getItem("deskpilot_req_count");

    if (savedPrompt) setPrompt(savedPrompt);
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)); } catch (e) {}
    }
    if (savedResult) setResult(savedResult);
    if (savedTokens) {
      try { setTokens(JSON.parse(savedTokens)); } catch (e) {}
    }
    if (savedReqCount) {
      setRequestCount(parseInt(savedReqCount, 10) || 0);
    }
  }, []);

  // 3. Persist state to localStorage
  useEffect(() => {
    if (logs.length > 0) localStorage.setItem("deskpilot_logs", JSON.stringify(logs));
    if (result) localStorage.setItem("deskpilot_result", result);
    if (tokens.totalTokens > 0) localStorage.setItem("deskpilot_tokens", JSON.stringify(tokens));
    if (requestCount > 0) localStorage.setItem("deskpilot_req_count", requestCount.toString());
  }, [logs, result, tokens, requestCount]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrompt(value);
    localStorage.setItem("deskpilot_prompt", value);
  };

  const handleClearSession = () => {
    localStorage.removeItem("deskpilot_prompt");
    localStorage.removeItem("deskpilot_logs");
    localStorage.removeItem("deskpilot_result");
    localStorage.removeItem("deskpilot_tokens");
    localStorage.removeItem("deskpilot_req_count");
    setPrompt("");
    setLogs([]);
    setResult("");
    setTokens({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    setRequestCount(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!prompt.trim()) return;

  setLoading(true);
  setLogs([]);
  setResult("");
  setTokens({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  setRequestCount((prev) => prev + 1);

  // Generate unique idempotency key per execution submission
  const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

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
              setLogs((prev) => [...prev, parsed.data]);
            } else if (parsed.type === "tools_discovered") {
              setLogs((prev) => [...prev, `[MCP] Discovered tools: ${parsed.data.join(", ")}`]);
            } else if (parsed.type === "tool_call_start") {
              setLogs((prev) => [...prev, `[Protocol] Executing tool '${parsed.data.name}' with args: ${JSON.stringify(parsed.data.args)}`]);
            } else if (parsed.type === "tool_call_complete") {
              setLogs((prev) => [...prev, `[Success] Tool '${parsed.data.name}' executed.`]);
            } else if (parsed.type === "usage") {
              setTokens(parsed.data);
            } else if (parsed.type === "final_answer") {
              setResult(parsed.data);
            } else if (parsed.type === "error") {
              setLogs((prev) => [...prev, `[Error] ${parsed.data}`]);
            }
          } catch (err) {}
        }
      }
    }
  } catch (err: any) {
    setLogs((prev) => [...prev, `[Fatal] ${err.message || "Failed to reach backend route."}`]);
  } finally {
    setLoading(false);
    fetchKeyStatus();
  }
};

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-indigo-400">DeskPilot Operations Hub</h1>
            <p className="text-sm text-slate-400">Decoupled Model Context Protocol (MCP) Enterprise Agent</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {keyInfo && (
              <span className="px-3 py-1.5 text-xs bg-emerald-950/60 text-emerald-400 rounded-md border border-emerald-800 font-mono">
                {keyInfo.is_free_tier ? "OpenRouter Free Tier" : "OpenRouter API Key Active"}
              </span>
            )}
            {requestCount > 0 && (
              <span className="px-3 py-1.5 text-xs bg-slate-900 text-slate-300 rounded-md border border-slate-800 font-mono">
                Runs: {requestCount}
              </span>
            )}
            {tokens.totalTokens > 0 && (
              <span className="px-3 py-1.5 text-xs bg-slate-900 text-slate-300 rounded-md border border-slate-800 font-mono">
                Tokens: {tokens.promptTokens} in / {tokens.completionTokens} out ({tokens.totalTokens} total)
              </span>
            )}
            <button
              onClick={handleClearSession}
              type="button"
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
            >
              Clear Session
            </button>
            <span className="px-3 py-1 text-xs bg-indigo-950 text-indigo-300 rounded-full border border-indigo-800">
              SSE Active Stream
            </span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            type="text"
            value={prompt}
            onChange={handlePromptChange}
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
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Live Protocol Logs</h2>
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-900">
              {logs.length === 0 && <span className="text-slate-600">Awaiting execution stream...</span>}
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={log.startsWith("[Error]") || log.startsWith("[Fatal]") ? "text-rose-400" : "text-emerald-400"}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

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