interface ExecutiveSummaryProps {
  result: string;
}

export function ExecutiveSummary({ result }: ExecutiveSummaryProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col h-[400px]">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Executive Summary
      </h2>
      <div className="flex-1 overflow-y-auto text-sm text-slate-200 bg-slate-950 p-4 rounded-lg border border-slate-900 whitespace-pre-wrap">
        {result || <span className="text-slate-600">Final report will stream here...</span>}
      </div>
    </div>
  );
}