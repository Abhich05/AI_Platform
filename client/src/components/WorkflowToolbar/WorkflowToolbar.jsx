import { RotateCcw, Save } from 'lucide-react';

export default function WorkflowToolbar({ hasWorkflow, isSaving, onRegenerate, onSave }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onRegenerate}
        disabled={!hasWorkflow}
        className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
      >
        <RotateCcw className="h-4 w-4" />
        Regenerate
      </button>
      <button
        onClick={onSave}
        disabled={!hasWorkflow || isSaving}
        className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {isSaving ? 'Saving...' : 'Save workflow'}
      </button>
    </div>
  );
}
