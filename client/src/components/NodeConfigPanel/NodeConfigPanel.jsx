import { Trash2, X } from 'lucide-react';
import { getNodeCategory } from '@/lib/nodeTypes';

export default function NodeConfigPanel({ node, onChangeLabel, onChangeConfig, onDelete, onClose }) {
  if (!node) {
    return (
      <aside className="w-80 shrink-0 border-l border-surface-border bg-surface-card p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Configuration
        </h2>
        <p className="text-sm text-slate-500">Select a node on the canvas to configure it.</p>
      </aside>
    );
  }

  const category = getNodeCategory(node.type);
  const config = node.data?.config || {};

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-surface-border bg-surface-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {category.label}
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs text-slate-400">Label</label>
        <input
          value={node.data?.label || ''}
          onChange={(e) => onChangeLabel(e.target.value)}
          className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {category.fields.length === 0 ? (
        <p className="text-sm text-slate-500">This node type has no additional configuration.</p>
      ) : (
        <div className="space-y-4">
          {category.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs text-slate-400">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={config[field.key] || ''}
                  onChange={(e) => onChangeConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              ) : (
                <input
                  type={field.type}
                  value={config[field.key] || ''}
                  onChange={(e) => onChangeConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onDelete}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-red-500/30 py-2 text-sm text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
        Delete node
      </button>
    </aside>
  );
}
