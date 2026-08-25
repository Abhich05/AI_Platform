import { Sparkles } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'When a new invoice arrives, check its status, email the customer, and log it to a sheet',
  'Send a Slack notification every time a form is submitted',
  'Post new signups to our Discord channel',
  'Append every new order to a Google Sheet',
];

export default function PromptInputPanel({ prompt, onChangePrompt, onGenerate, isGenerating }) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4">
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        Describe your automation
      </label>
      <textarea
        rows={4}
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        placeholder="e.g. When a new invoice arrives, email the customer and log it to a sheet"
        className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm outline-none focus:border-indigo-500"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            onClick={() => onChangePrompt(example)}
            className="rounded-full border border-surface-border px-3 py-1 text-xs text-slate-400 hover:border-indigo-500/50 hover:text-slate-200"
          >
            {example.length > 40 ? `${example.slice(0, 40)}...` : example}
          </button>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="mt-4 flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {isGenerating ? 'Generating...' : 'Generate workflow'}
      </button>
    </div>
  );
}
