import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  Plug,
  Settings,
  Bell,
  LogOut,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { connectSocket } from '@/services/socket';
import api from '@/services/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workflows', label: 'Workflows', icon: Workflow },
  { href: '/executions', label: 'Executions', icon: ListChecks },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const TYPE_ICONS = {
  success: { icon: CheckCircle2, color: 'text-green-400' },
  failure: { icon: XCircle, color: 'text-red-400' },
  escalation: { icon: AlertTriangle, color: 'text-amber-400' },
  info: { icon: Info, color: 'text-slate-400' },
};

export default function AppShell({ children }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  useEffect(() => {
    api.get('/notifications').then(({ data }) => {
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    });

    const socket = connectSocket();
    socket.emit('subscribe:notifications');

    const onConnect = () => socket.emit('subscribe:notifications');
    const onNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('connect', onConnect);
    socket.on('notification:new', onNotification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('notification:new', onNotification);
    };
  }, []);

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
    if (unreadCount > 0) {
      api.post('/notifications/mark-all-read').then(() => {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      });
    }
  };

  return (
    <div className="flex h-screen bg-surface text-slate-100">
      <aside className="flex w-60 flex-col border-r border-surface-border bg-surface-card">
        <div className="flex items-center gap-2 px-5 py-5">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <span className="text-sm font-semibold tracking-wide">Agentflow AI</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href || router.pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-border px-3 py-4">
          <div className="mb-2 px-3 text-xs text-slate-500">
            {user?.name} · {user?.role}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end border-b border-surface-border bg-surface-card px-6 py-3">
          <button
            onClick={handleOpenDrawer}
            className="relative rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {drawerOpen && (
        <div className="fixed right-0 top-0 h-full w-80 overflow-y-auto border-l border-surface-border bg-surface-card p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <button onClick={() => setDrawerOpen(false)} className="text-xs text-slate-500 hover:text-slate-300">
              Close
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => {
                const meta = TYPE_ICONS[n.type] || TYPE_ICONS.info;
                const Icon = meta.icon;
                return (
                  <li key={n.id} className="flex gap-2 rounded-md border border-surface-border p-3 text-sm">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-600">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
