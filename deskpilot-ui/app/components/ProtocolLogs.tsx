interface ProtocolLogsProps {
  logs: string[];
}

export function ProtocolLogs({ logs }: ProtocolLogsProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Live Protocol Logs
      </h2>
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-900">
        {logs.length === 0 && <span className="text-slate-600">Awaiting execution stream...</span>}
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={
              log.startsWith("[Error]") || log.startsWith("[Fatal]")
                ? "text-rose-400"
                : "text-emerald-400"
            }
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}