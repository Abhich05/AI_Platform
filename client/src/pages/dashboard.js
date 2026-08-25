import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import { useAuthStore } from '@/store/authStore';

export default function Dashboard() {
  const { user, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [fetchProfile]);

  return (
    <ProtectedRoute>
      <AppShell>
        <h1 className="text-xl font-semibold">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Your operator console. Workflow metrics, execution activity, and the AI feed will
          appear here as they come online in later phases.
        </p>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border border-surface-border bg-surface-card" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Active workflows', value: '0' },
              { label: 'Executions today', value: '0' },
              { label: 'Success rate', value: '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-surface-border bg-surface-card p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
