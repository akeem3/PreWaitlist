export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-(--card-radius) border border-border bg-card"
          />
        ))}
      </div>

      <div className="mb-6 h-[200px] animate-pulse rounded-(--card-radius) border border-border bg-card" />

      <div className="mb-6 h-[120px] animate-pulse rounded-(--card-radius) border border-border bg-card" />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="h-[160px] animate-pulse rounded-(--card-radius) border border-border bg-card" />
        <div className="h-[160px] animate-pulse rounded-(--card-radius) border border-border bg-card" />
      </div>

      <div className="rounded-(--card-radius) border border-border bg-card">
        <div className="px-5 pt-5">
          <div className="mb-4 h-10 animate-pulse rounded-xl bg-muted" />
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-border px-5 py-3">
            <div className="flex gap-4">
              <div className="h-4 w-8 animate-pulse rounded bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
