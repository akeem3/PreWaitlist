"use client";

import { useEffect, useState } from "react";

interface WarmthData {
  hot: number;
  warm: number;
  cold: number;
  unscored: number;
  total: number;
}

function WarmthBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const width = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs font-medium text-foreground">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="min-w-20 shrink-0 text-right text-xs text-muted-foreground">
        {total > 0 ? `${count} (${width}%)` : "\u2014"}
      </span>
    </div>
  );
}

export default function WarmthPanel() {
  const [data, setData] = useState<WarmthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/warmth")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.total !== undefined) {
          setData(json);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Warmth Distribution
        </h3>
        <div className="space-y-3">
          {["Hot", "Warm", "Cold", "Unscored"].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-10 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Warmth Distribution
      </h3>
      <div className="space-y-3">
        <WarmthBar
          label="Hot"
          count={data?.hot ?? 0}
          total={data?.total ?? 0}
          color="bg-status-hot"
        />
        <WarmthBar
          label="Warm"
          count={data?.warm ?? 0}
          total={data?.total ?? 0}
          color="bg-status-warm"
        />
        <WarmthBar
          label="Cold"
          count={data?.cold ?? 0}
          total={data?.total ?? 0}
          color="bg-status-cold"
        />
        <WarmthBar
          label="Unscored"
          count={data?.unscored ?? 0}
          total={data?.total ?? 0}
          color="bg-muted"
        />
      </div>
    </div>
  );
}
