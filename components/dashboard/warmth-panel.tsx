"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Panel, { PanelHeader, panelChrome } from "./panel";
import { cn } from "../lib/cn";

type TierKind = "hot" | "warm" | "cold";

const TIER_ICON_PATHS: Record<TierKind, ReactNode> = {
  hot: (
    <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
  ),
  warm: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  cold: (
    <>
      <path d="m10 20-1.25-2.5L6 18" />
      <path d="M10 4 8.75 6.5 6 6" />
      <path d="m14 20 1.25-2.5L18 18" />
      <path d="m14 4 1.25 2.5L18 6" />
      <path d="m17 21-3-6h-4" />
      <path d="m17 3-3 6 1.5 3" />
      <path d="M2 12h6.5L10 9" />
      <path d="m20 10-1.5 2 1.5 2" />
      <path d="M22 12h-6.5L14 15" />
      <path d="m4 10 1.5 2L4 14" />
      <path d="m7 21 3-6-1.5-3" />
      <path d="m7 3 3 6h4" />
    </>
  ),
};

function TierIcon({ kind, className }: { kind: TierKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      aria-hidden="true"
    >
      {TIER_ICON_PATHS[kind]}
    </svg>
  );
}

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
  iconKind,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  valueColor: string;
  iconKind: TierKind;
}) {
  const width = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-16 shrink-0 items-center gap-1.5 text-xs font-medium text-foreground">
        <TierIcon kind={iconKind} className={valueColor} />
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
        iconKind="hot"
      />
      <WarmthBar
        label="Warm"
        count={data?.warm ?? 0}
        total={data?.total ?? 0}
        color="bg-status-warm"
        valueColor="text-status-warm"
        iconKind="warm"
      />
      <WarmthBar
        label="Cold"
        count={data?.cold ?? 0}
        total={data?.total ?? 0}
        color="bg-status-cold"
        valueColor="text-status-cold"
        iconKind="cold"
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
