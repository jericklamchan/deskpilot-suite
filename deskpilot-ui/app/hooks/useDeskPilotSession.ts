"use client";

import { useState, useEffect, useCallback } from "react";
import { KeyInfo, TokenUsage } from "../types";

const INITIAL_TOKENS: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

export function useDeskPilotSession() {
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenUsage>(INITIAL_TOKENS);
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [requestCount, setRequestCount] = useState(0);

  // 1. Fetch OpenRouter Key Status
  const fetchKeyStatus = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchKeyStatus();
  }, [fetchKeyStatus]);

  // 2. Restore state from localStorage on initial mount
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

  // 3. Persist state updates to localStorage
  useEffect(() => {
    if (logs.length > 0) localStorage.setItem("deskpilot_logs", JSON.stringify(logs));
    if (result) localStorage.setItem("deskpilot_result", result);
    if (tokens.totalTokens > 0) localStorage.setItem("deskpilot_tokens", JSON.stringify(tokens));
    if (requestCount > 0) localStorage.setItem("deskpilot_req_count", requestCount.toString());
  }, [logs, result, tokens, requestCount]);

  const updatePrompt = (value: string) => {
    setPrompt(value);
    localStorage.setItem("deskpilot_prompt", value);
  };

  const clearSession = () => {
    localStorage.removeItem("deskpilot_prompt");
    localStorage.removeItem("deskpilot_logs");
    localStorage.removeItem("deskpilot_result");
    localStorage.removeItem("deskpilot_tokens");
    localStorage.removeItem("deskpilot_req_count");
    setPrompt("");
    setLogs([]);
    setResult("");
    setTokens(INITIAL_TOKENS);
    setRequestCount(0);
  };

  const runAgentStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setLogs([]);
    setResult("");
    setTokens(INITIAL_TOKENS);
    setRequestCount((prev) => prev + 1);

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `req_${Date.now()}`;

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
                setLogs((prev) => [
                  ...prev,
                  `[Protocol] Executing tool '${parsed.data.name}' with args: ${JSON.stringify(parsed.data.args)}`,
                ]);
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

  return {
    prompt,
    updatePrompt,
    logs,
    result,
    loading,
    tokens,
    keyInfo,
    requestCount,
    clearSession,
    runAgentStream,
  };
}