import { NODE_CATEGORIES } from '@/lib/nodeTypes';

export default function NodePalette() {
  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/agentflow-node', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-r border-surface-border bg-surface-card p-3">
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Node Palette
      </h2>
      <div className="space-y-2">
        {NODE_CATEGORIES.map(({ type, label, icon: Icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => handleDragStart(e, type)}
            className="flex cursor-grab items-center gap-2 rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-slate-200 transition-colors hover:border-indigo-500/50 active:cursor-grabbing"
          >
            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 px-1 text-xs text-slate-500">
        Drag a node onto the canvas to add it to your workflow.
      </p>
    </aside>
  );
}
