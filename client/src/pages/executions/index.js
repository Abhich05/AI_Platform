import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import api from '@/services/api';

const STATUS_STYLES = {
  PENDING: 'bg-slate-500/10 text-slate-300',
  RUNNING: 'bg-blue-500/10 text-blue-300',
  RETRYING: 'bg-amber-500/10 text-amber-400',
  PAUSED: 'bg-amber-500/10 text-amber-400',
  COMPLETED: 'bg-green-500/10 text-green-400',
  FAILED: 'bg-red-500/10 text-red-400',
  CANCELLED: 'bg-slate-500/10 text-slate-400',
};

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ExecutionsList() {
  const [executions, setExecutions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/executions', { params: { page, status } });
      setExecutions(data.items);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Executions</h1>
          <p className="mt-1 text-sm text-slate-400">All workflow runs, updated automatically every few seconds.</p>
        </div>

        <div className="mb-4">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-md border border-surface-border bg-surface-card px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_STYLES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading && executions.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg border border-surface-border bg-surface-card" />
            ))}
          </div>
        ) : executions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-border p-10 text-center text-sm text-slate-500">
            No executions yet. Trigger a run from a workflow to see it here.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-surface-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-card text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Workflow</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Started</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec) => (
                  <tr key={exec.id} className="border-t border-surface-border hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link href={`/executions/${exec.id}`} className="font-medium text-slate-100 hover:text-indigo-300">
                        {exec.workflowName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[exec.status]}`}>
                        {exec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDuration(exec.duration)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {exec.startTime ? new Date(exec.startTime).toLocaleString() : '—'}
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
