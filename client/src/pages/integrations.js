import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Mail, MessageSquare, MessageCircle, Table, CheckCircle2, AlertCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import api from '@/services/api';

const PROVIDER_META = {
  gmail: { label: 'Gmail', icon: Mail, color: '#ef4444', description: 'Send and read email on your behalf.' },
  slack: { label: 'Slack', icon: MessageSquare, color: '#a855f7', description: 'Post messages to your workspace.' },
  discord: { label: 'Discord', icon: MessageCircle, color: '#818cf8', description: 'Post messages via a bot in your server.' },
  'google-sheets': { label: 'Google Sheets', icon: Table, color: '#22c55e', description: 'Append and read spreadsheet rows.' },
};

export default function Integrations() {
  const router = useRouter();
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [banner, setBanner] = useState(null);

  const load = useCallback(async () => {
    const { data } = await api.get('/integrations/status');
    setStatus(data.status);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!router.isReady) return;
    const { connected, error } = router.query;
    if (connected) {
      setBanner({ type: 'success', message: `${PROVIDER_META[connected]?.label || connected} connected successfully.` });
      load();
    } else if (error) {
      setBanner({ type: 'error', message: `Connection failed: ${error}` });
    }
  }, [router.isReady, router.query, load]);

  const handleConnect = async (provider) => {
    setConnectingProvider(provider);
    try {
      const { data } = await api.get(`/integrations/oauth/${provider}/start`);
      window.location.href = data.url;
    } catch (err) {
      setBanner({
        type: 'error',
        message: err.response?.data?.message || `Unable to start ${provider} connection`,
      });
      setConnectingProvider(null);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Integrations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Connect the tools your workflows send data to and pull data from.
          </p>
        </div>

        {banner && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
              banner.type === 'success'
                ? 'border-green-500/30 bg-green-500/5 text-green-300'
                : 'border-red-500/30 bg-red-500/5 text-red-300'
            }`}
          >
            {banner.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {banner.message}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg border border-surface-border bg-surface-card" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {status.map(({ provider, configured, isConnected, expired }) => {
              const meta = PROVIDER_META[provider];
              const Icon = meta.icon;
              return (
                <div key={provider} className="rounded-lg border border-surface-border bg-surface-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" style={{ color: meta.color }} />
                      <div>
                        <h3 className="font-semibold text-slate-100">{meta.label}</h3>
                        <p className="text-xs text-slate-500">{meta.description}</p>
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">Connected</span>
                    ) : expired ? (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">Expired</span>
                    ) : (
                      <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-slate-400">
                        Disconnected
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    {!configured ? (
                      <p className="text-xs text-slate-500">
                        Not configured on this server. An admin needs to set the {meta.label} OAuth credentials.
                      </p>
                    ) : (
                      <button
                        onClick={() => handleConnect(provider)}
                        disabled={connectingProvider === provider}
                        className="rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                      >
                        {connectingProvider === provider
                          ? 'Redirecting...'
                          : isConnected || expired
                          ? 'Reconnect'
                          : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
