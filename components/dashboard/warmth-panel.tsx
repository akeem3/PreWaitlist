"use client";

import { useEffect, useState } from "react";

interface WarmthData {
  hot: number;
  warm: number;
  cold: number;
  unscored: number;
  total: number;
}

interface WarmthPanelProps {
  tier?: string;
  warmthData?: WarmthData | null;
  onUpgradeClick?: () => void;
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

export default function WarmthPanel({
  tier = "free",
  warmthData: externalData,
  onUpgradeClick,
}: WarmthPanelProps) {
  const [internalData, setInternalData] = useState<WarmthData | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);

  const data = externalData ?? internalData;
  const loading = externalData ? false : internalLoading;

  useEffect(() => {
    if (externalData) return;
    let cancelled = false;
    fetch("/api/dashboard/warmth")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.total !== undefined) {
          setInternalData(json);
        }
      })
      .catch(() => {
        if (!cancelled) setInternalData(null);
      })
      .finally(() => {
        if (!cancelled) setInternalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [externalData]);

  if (tier === "free") {
    return (
      <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Warmth Distribution
          </h3>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-accent"
            >
              <path
                d="M6 2L7.5 5H10.5L8 7L9 10.5L6 8.5L3 10.5L4 7L1.5 5H4.5L6 2Z"
                fill="currentColor"
              />
            </svg>
            Upgrade to target segments
          </button>
        </div>
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
