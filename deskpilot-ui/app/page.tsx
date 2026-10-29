"use client";

import { useDeskPilotSession } from "./hooks/useDeskPilotSession";
import { Header } from "./components/Header";
import { PromptForm } from "./components/PromptForm";
import { ProtocolLogs } from "./components/ProtocolLogs";
import { ExecutiveSummary } from "./components/ExecutiveSummary";

export default function Dashboard() {
  const {
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
  } = useDeskPilotSession();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header
          keyInfo={keyInfo}
          requestCount={requestCount}
          tokens={tokens}
          onClearSession={clearSession}
        />

        <PromptForm
          prompt={prompt}
          loading={loading}
          onPromptChange={updatePrompt}
          onSubmit={runAgentStream}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProtocolLogs logs={logs} />
          <ExecutiveSummary result={result} />
        </div>
      </div>
    </main>
  );
}