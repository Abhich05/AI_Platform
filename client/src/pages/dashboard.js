import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import MetricGrid from '@/components/MetricGrid/MetricGrid';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

export default function Dashboard() {
  const { user, fetchProfile } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProfile(), api.get('/workflows/dashboard')])
      .then(([, res]) => setStats(res.data))
      .finally(() => setLoading(false));
  }, [fetchProfile]);

  const metrics = stats
    ? [
        { label: 'Active workflows', value: stats.activeWorkflows },
        { label: 'Executions today', value: stats.executionsToday },
        { label: 'Success rate', value: stats.successRate !== null ? `${stats.successRate}%` : '—' },
      ]
    : [];

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Welcome{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Your operator console. The AI activity feed will appear here as later phases come
              online.
            </p>
          </div>
          <Link
            href="/workflows"
            className="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Go to workflows
          </Link>
        </div>

        <MetricGrid metrics={metrics} loading={loading} />

        <div className="mt-6 rounded-lg border border-surface-border bg-surface-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Recent executions</h2>
          {loading ? (
            <div className="h-16 animate-pulse rounded-md bg-white/5" />
          ) : stats?.recentExecutions?.length ? (
            <ul className="divide-y divide-surface-border text-sm">
              {stats.recentExecutions.map((exec) => (
                <li key={exec.id}>
                  <Link
                    href={`/executions/${exec.id}`}
                    className="flex justify-between py-2 text-slate-300 hover:text-indigo-300"
                  >
                    <span>{exec.workflowName}</span>
                    <span className="text-slate-500">{exec.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No executions yet. Trigger a run from a workflow to see it here.
            </p>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
