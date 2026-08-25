import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 text-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold">Agentflow AI</span>
        </div>

        <div className="rounded-lg border border-surface-border bg-surface-card p-6">
          <h1 className="mb-1 text-lg font-semibold">Welcome back</h1>
          <p className="mb-6 text-sm text-slate-400">Log in to your operator console.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
