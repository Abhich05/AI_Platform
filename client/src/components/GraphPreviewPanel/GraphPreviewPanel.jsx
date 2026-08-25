const SOURCE_LABELS = {
  openrouter: 'OpenRouter',
  gemini: 'Gemini',
  deterministic: 'Rule-based (no AI key configured)',
};

export default function GraphPreviewPanel({ workflow }) {
  if (!workflow) {
    return (
      <div className="rounded-lg border border-dashed border-surface-border p-6 text-center text-sm text-slate-500">
        Generate a workflow to preview it here before saving.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">{workflow.name}</h3>
        <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300">
          {SOURCE_LABELS[workflow.source] || workflow.source}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-400">{workflow.description}</p>
      <p className="mt-2 text-xs text-slate-500">
        {workflow.nodes.length} node{workflow.nodes.length === 1 ? '' : 's'} · {workflow.edges.length} connection
        {workflow.edges.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}
