export default function MetricGrid({ metrics, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-surface-border bg-surface-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map(({ label, value }) => (
        <div key={label} className="rounded-lg border border-surface-border bg-surface-card p-4">
          <p className="text-xs text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
      ))}
    </div>
  );
}
