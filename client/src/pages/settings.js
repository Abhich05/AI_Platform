import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import AppShell from '@/components/AppShell/AppShell';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import api from '@/services/api';
import { CheckCircle2, XCircle, MinusCircle, Sun, Moon, Monitor } from 'lucide-react';

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-5">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function HealthRow({ label, ok, okLabel, notOkLabel, neutral = false }) {
  const Icon = neutral ? MinusCircle : ok ? CheckCircle2 : XCircle;
  const color = neutral ? 'text-slate-400' : ok ? 'text-green-400' : 'text-amber-400';
  return (
    <div className="flex items-center justify-between border-b border-surface-border py-2.5 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`flex items-center gap-1.5 text-xs ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {ok ? okLabel : notOkLabel}
      </span>
    </div>
  );
}

export default function Settings() {
  const { user, updateProfile, fetchProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [name, setName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    api
      .get('/settings/health')
      .then(({ data }) => setHealth(data.health))
      .finally(() => setHealthLoading(false));
  }, [fetchProfile]);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');
    try {
      await updateProfile({ name });
      setProfileMessage('Profile updated.');
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Unable to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Unable to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Manage your profile, security, and system configuration.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Profile" description="Your account details.">
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Email</label>
                <input
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-slate-500 outline-none"
                />
              </div>
              {profileMessage && <p className="text-xs text-slate-400">{profileMessage}</p>}
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {profileSaving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Role & account" description="Read-only account details.">
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Role</dt>
                <dd className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300">{user?.role}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Member since</dt>
                <dd className="text-slate-300">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Last login</dt>
                <dd className="text-slate-300">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Security" description="Change your password.">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
              {passwordMessage && <p className="text-xs text-green-400">{passwordMessage}</p>}
              <button
                type="submit"
                disabled={passwordSaving}
                className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
              >
                {passwordSaving ? 'Changing...' : 'Change password'}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Appearance" description="Choose how Agentflow looks on this device.">
            <div className="flex gap-2">
              {[
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-xs transition-colors ${
                    theme === value
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-surface-border text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="System health"
            description="Live configuration status. No secret values are ever shown here."
          >
            {healthLoading ? (
              <div className="h-40 animate-pulse rounded-md bg-white/5" />
            ) : (
              <div>
                <HealthRow
                  label="Database"
                  ok={health.database === 'external'}
                  neutral
                  okLabel="External (MongoDB Atlas)"
                  notOkLabel="In-memory (data resets on restart)"
                />
                <HealthRow
                  label="JWT signing secret"
                  ok={health.jwtSecretConfigured}
                  okLabel="Configured"
                  notOkLabel="Using insecure default"
                />
                <HealthRow
                  label="Credential encryption key"
                  ok={health.credentialEncryptionConfigured}
                  okLabel="Configured"
                  notOkLabel="Using insecure default"
                />
                <HealthRow
                  label="Background queue (Redis)"
                  ok={health.redis === 'connected'}
                  neutral
                  okLabel="Connected"
                  notOkLabel="Not configured (in-process fallback)"
                />
                <HealthRow
                  label="LangGraph orchestration"
                  ok={health.langGraph === 'available'}
                  neutral
                  okLabel="Available"
                  notOkLabel="Not installed"
                />
                <HealthRow
                  label="AI generation - OpenRouter"
                  ok={health.aiProviders.openrouter}
                  okLabel="Configured"
                  notOkLabel="Not configured"
                />
                <HealthRow
                  label="AI generation - Gemini"
                  ok={health.aiProviders.gemini}
                  okLabel="Configured"
                  notOkLabel="Not configured"
                />
                <HealthRow
                  label="Gmail / Google Sheets OAuth"
                  ok={health.integrationProviders.gmail}
                  okLabel="Configured"
                  notOkLabel="Not configured"
                />
                <HealthRow
                  label="Slack OAuth"
                  ok={health.integrationProviders.slack}
                  okLabel="Configured"
                  notOkLabel="Not configured"
                />
                <HealthRow
                  label="Discord OAuth + bot"
                  ok={health.integrationProviders.discord}
                  okLabel="Configured"
                  notOkLabel="Not configured"
                />
              </div>
            )}
          </SectionCard>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
