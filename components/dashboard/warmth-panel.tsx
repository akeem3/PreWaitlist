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
  tier: string;
  subdomain: string;
}

function LockedOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-[var(--card-radius)] bg-background/80">
      <div className="flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          fill="none"
          className="text-muted-foreground"
        >
          <rect
            x="2.5"
            y="5"
            width="7"
            height="5.5"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
          Pro
        </span>
      </div>
    </div>
  );
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
  const width = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {total > 0 ? count : "\u2014"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function WarmthPanel({ tier, subdomain }: WarmthPanelProps) {
  const [data, setData] = useState<WarmthData | null>(null);
  const isFree = tier === "free";

  useEffect(() => {
    if (isFree) return;

    let cancelled = false;
    fetch(`/api/warmth/${subdomain}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.total !== undefined) {
          setData(json);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isFree, subdomain]);

  const displayData = isFree
    ? { hot: 0, warm: 0, cold: 0, unscored: 0, total: 0 }
    : data;

  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Warmth Distribution
      </h3>
      <div className="relative">
        <div className={isFree ? "pointer-events-none blur-[2px]" : ""}>
          <div className="space-y-3">
            <WarmthBar
              label="Hot"
              count={displayData?.hot ?? 0}
              total={displayData?.total ?? 0}
              color="bg-red-500"
            />
            <WarmthBar
              label="Warm"
              count={displayData?.warm ?? 0}
              total={displayData?.total ?? 0}
              color="bg-amber-500"
            />
            <WarmthBar
              label="Cold"
              count={displayData?.cold ?? 0}
              total={displayData?.total ?? 0}
              color="bg-blue-500"
            />
            <WarmthBar
              label="Unscored"
              count={displayData?.unscored ?? 0}
              total={displayData?.total ?? 0}
              color="bg-gray-400"
            />
          </div>
        </div>
        {isFree && <LockedOverlay />}
      </div>
    </div>
  );
}
