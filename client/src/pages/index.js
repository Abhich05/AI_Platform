import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sparkles, Workflow, Bot, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Landing() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated) {
      router.replace(token ? '/dashboard' : '/login');
    }
  }, [isHydrated, token, router]);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-slate-100">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold">Agentflow AI</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-md px-4 py-2 text-sm text-slate-300 hover:text-white">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
          Describe an automation. Watch it become a workflow.
        </h1>
        <p className="mt-4 max-w-xl text-slate-400">
          Agentflow turns plain-English prompts into executable graphs, runs them through a
          chain of cooperating AI agents, and streams every step back to you in real time.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/register"
            className="rounded-md bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Start building
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-surface-border px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            I have an account
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: Workflow, title: 'Prompt to graph', desc: 'Natural language becomes a runnable node graph on a live canvas.' },
            { icon: Bot, title: 'Multi-agent execution', desc: 'Planner, executor, validator, recovery, and monitoring agents cooperate on every run.' },
            { icon: ShieldCheck, title: 'Real integrations', desc: 'Gmail, Slack, Discord, and Google Sheets connected via OAuth with encrypted credentials.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-surface-border bg-surface-card p-5 text-left">
              <Icon className="mb-3 h-6 w-6 text-indigo-400" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
