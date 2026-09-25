"use client";

import Link from "next/link";
import Panel, { PanelHeader, panelChrome } from "./panel";
import { cn } from "../lib/cn";

interface WarmthData {
  hot: number;
  warm: number;
  cold: number;
  total: number;
}

interface WarmthPanelProps {
  tier?: string;
  warmthData?: WarmthData | null;
  waitlistId?: string;
  onUpgradeClick?: () => void;
}

function subscriberWord(count: number): string {
  return count === 1 ? "subscriber" : "subscribers";
}

function WarmthBar({
  label,
  count,
  total,
  color,
  valueColor,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  valueColor: string;
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
      <span
        className={cn(
          "min-w-20 shrink-0 text-right text-xs",
          total > 0 ? valueColor : "text-muted-foreground"
        )}
      >
        {total > 0 ? `${count} (${width}%)` : "\u2014"}
      </span>
    </div>
  );
}

function MetaLine({ total }: { total: number }) {
  if (total <= 0) return null;
  return (
    <p className="mb-4 text-body-sm text-muted-foreground">
      <span className="text-accent">
        {total} {subscriberWord(total)}
      </span>
    </p>
  );
}

function WarmthBars({ data }: { data: WarmthData | null | undefined }) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-3">
      <WarmthBar
        label="Hot"
        count={data?.hot ?? 0}
        total={data?.total ?? 0}
        color="bg-status-hot"
        valueColor="text-status-hot"
      />
      <WarmthBar
        label="Warm"
        count={data?.warm ?? 0}
        total={data?.total ?? 0}
        color="bg-status-warm"
        valueColor="text-status-warm"
      />
      <WarmthBar
        label="Cold"
        count={data?.cold ?? 0}
        total={data?.total ?? 0}
        color="bg-status-cold"
        valueColor="text-status-cold"
      />
    </div>
  );
}

export default function WarmthPanel({
  tier = "free",
  warmthData: externalData,
  waitlistId,
  onUpgradeClick,
}: WarmthPanelProps) {
  // AC2: no internal fetch fallback — the old call omitted waitlist_id and
  // always 400'd. Callers pass warmthData (dashboard always does); missing
  // data renders zero-count / em-dash bars.
  const data = externalData;
  const total = data?.total ?? 0;

  if (tier === "free") {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        className={cn(
          panelChrome,
          "flex w-full flex-col text-left transition-colors hover:bg-muted/30"
        )}
      >
        <PanelHeader
          title="Warmth Distribution"
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
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
            </span>
          }
        />
        <MetaLine total={total} />
        <WarmthBars data={data} />
      </button>
    );
  }

  return (
    <Panel
      className="group relative flex flex-col transition-colors hover:bg-muted/30"
      title={
        <Link
          href={`/dashboard/warmth${waitlistId ? `?wid=${waitlistId}` : ""}`}
          className="after:absolute after:inset-0 after:rounded-[var(--card-radius)] focus-visible:after:outline-2 focus-visible:after:outline-accent"
        >
          Warmth Distribution
        </Link>
      }
      action={
        <span
          aria-hidden="true"
          className="text-body-sm font-medium text-accent transition-colors group-hover:text-accent/80"
        >
          View all &rarr;
        </span>
      }
    >
      <MetaLine total={total} />
      <WarmthBars data={data} />
    </Panel>
  );
}
