import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Pause, Play, Square, Radio } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import api from '@/services/api';
import { connectSocket } from '@/services/socket';

const STATUS_STYLES = {
  PENDING: 'bg-slate-500/10 text-slate-300',
  RUNNING: 'bg-blue-500/10 text-blue-300',
  RETRYING: 'bg-amber-500/10 text-amber-400',
  PAUSED: 'bg-amber-500/10 text-amber-400',
  COMPLETED: 'bg-green-500/10 text-green-400',
  FAILED: 'bg-red-500/10 text-red-400',
  CANCELLED: 'bg-slate-500/10 text-slate-400',
};

const AGENT_STYLES = {
  planner: 'bg-purple-500/10 text-purple-300',
  execution: 'bg-blue-500/10 text-blue-300',
  validation: 'bg-green-500/10 text-green-300',
  recovery: 'bg-amber-500/10 text-amber-300',
  monitoring: 'bg-slate-500/10 text-slate-300',
};

const LEVEL_STYLES = {
  info: 'text-slate-300',
  success: 'text-green-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
};

const ACTIVE_STATUSES = ['PENDING', 'RUNNING', 'PAUSED', 'RETRYING'];

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ExecutionDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [execution, setExecution] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [execRes, timelineRes] = await Promise.all([
      api.get(`/executions/${id}`),
      api.get(`/executions/${id}/timeline`),
    ]);
    setExecution(execRes.data.execution);
    setTimeline(timelineRes.data.timeline);
    setLoading(false);
  }, [id]);

  const refreshExecution = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get(`/executions/${id}`);
    setExecution(data.execution);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id) return undefined;

    const socket = connectSocket();
    socket.emit('subscribe:execution', id);

    const onConnect = () => {
      setIsLive(true);
      socket.emit('subscribe:execution', id);
    };
    const onDisconnect = () => setIsLive(false);
    const onLog = (event) => {
      if (event.executionId !== id) return;
      setTimeline((prev) => (prev.some((e) => e._id === event.id) ? prev : [...prev, { ...event, _id: event.id }]));
      refreshExecution();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('execution:log', onLog);
    setIsLive(socket.connected);

    return () => {
      socket.emit('unsubscribe:execution', id);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('execution:log', onLog);
    };
  }, [id, refreshExecution]);

  useEffect(() => {
    if (!execution || !ACTIVE_STATUSES.includes(execution.status) || isLive) return undefined;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [execution, load, isLive]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/${action}`);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !execution) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="h-64 animate-pulse rounded-lg border border-surface-border bg-surface-card" />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.push('/executions')}
              className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{execution.workflowName}</h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLES[execution.status]}`}>
                  {execution.status}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 text-green-400">
                    <Radio className="h-3 w-3" />
                    Live
                  </span>
                )}
                <span>Duration: {formatDuration(execution.duration)}</span>
                <span>Retries: {execution.retryCount}</span>
                <span>LangGraph: {execution.langGraph}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {execution.status === 'RUNNING' && (
              <button
                onClick={() => handleAction('pause')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                <Pause className="h-4 w-4" />
                Pause
              </button>
            )}
            {execution.status === 'PAUSED' && (
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
            )}
            {ACTIVE_STATUSES.includes(execution.status) && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </div>

        {execution.error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
            <span className="font-semibold">{execution.error.code}</span>: {execution.error.message}
          </div>
        )}

        <div className="rounded-lg border border-surface-border bg-surface-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Agent timeline</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((event) => (
                <li key={event._id} className="flex items-start gap-3 text-sm">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${AGENT_STYLES[event.agent]}`}>
                    {event.agent}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={LEVEL_STYLES[event.level]}>{event.message}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(event.createdAt).toLocaleTimeString()}
                      {event.nodeId ? ` · ${event.nodeId}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
