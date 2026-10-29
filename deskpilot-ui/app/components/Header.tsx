import { KeyInfo, TokenUsage } from "../types";

interface HeaderProps {
  keyInfo: KeyInfo | null;
  requestCount: number;
  tokens: TokenUsage;
  onClearSession: () => void;
}

export function Header({ keyInfo, requestCount, tokens, onClearSession }: HeaderProps) {
  return (
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
          onClick={onClearSession}
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
  );
}