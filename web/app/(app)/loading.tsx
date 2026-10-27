export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
