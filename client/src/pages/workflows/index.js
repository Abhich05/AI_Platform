import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, Search, Copy, Trash2, Workflow as WorkflowIcon } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import { useWorkflowStore } from '@/store/workflowStore';

const STATUS_STYLES = {
  draft: 'bg-slate-500/10 text-slate-300',
  active: 'bg-green-500/10 text-green-400',
  paused: 'bg-amber-500/10 text-amber-400',
  archived: 'bg-red-500/10 text-red-400',
};

export default function WorkflowsList() {
  const router = useRouter();
  const { workflows, pagination, isLoadingList, fetchWorkflows, createWorkflow, duplicateWorkflow, deleteWorkflow } =
    useWorkflowStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    fetchWorkflows({ page, search, status });
  }, [fetchWorkflows, page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const workflow = await createWorkflow({
        name: 'Untitled Workflow',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 100, y: 150 },
            data: { label: 'Manual Trigger', config: {} },
          },
        ],
        edges: [],
      });
      router.push(`/workflows/${workflow.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id) => {
    await duplicateWorkflow(id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workflow? This cannot be undone.')) return;
    await deleteWorkflow(id);
    load();
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Workflows</h1>
            <p className="mt-1 text-sm text-slate-400">Create, edit, and manage your automations.</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {creating ? 'Creating...' : 'New Workflow'}
          </button>
        </div>

        <div className="mb-4 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search workflows..."
              className="w-full rounded-md border border-surface-border bg-surface-card py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-md border border-surface-border bg-surface-card px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {isLoadingList ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border border-surface-border bg-surface-card" />
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-border p-10 text-center text-sm text-slate-500">
            <WorkflowIcon className="mx-auto mb-3 h-8 w-8 text-slate-600" />
            No workflows yet. Create one to get started.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-surface-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-card text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf) => (
                  <tr
                    key={wf.id}
                    className="cursor-pointer border-t border-surface-border hover:bg-white/5"
                    onClick={() => router.push(`/workflows/${wf.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{wf.name}</div>
                      {wf.tags?.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {wf.tags.map((tag) => (
                            <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[wf.status]}`}>
                        {wf.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">v{wf.version}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(wf.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDuplicate(wf.id)}
                          className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-100"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(wf.id)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-surface-border px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-slate-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-surface-border px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
