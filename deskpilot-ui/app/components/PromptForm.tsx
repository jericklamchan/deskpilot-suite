interface PromptFormProps {
  prompt: string;
  loading: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PromptForm({ prompt, loading, onPromptChange, onSubmit }: PromptFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-4">
      <input
        type="text"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
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
  );
}