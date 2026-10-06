"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TierIcon,
  type TierKind,
} from "../../../../components/dashboard/tier-icon";
import { capture } from "@/lib/analytics";

interface Subscriber {
  id: string;
  email: string;
  warmth_score: string | null;
  referral_count: number;
  last_engagement: string | null;
  created_at: string;
}

interface WarmthSummary {
  hot: number;
  warm: number;
  cold: number;
  total: number;
}

interface WarmthClientProps {
  subscribers: Subscriber[];
  summary: WarmthSummary;
  tier: string;
}

type SortField = "warmth_score" | "referral_count";
type SortDir = "asc" | "desc";
type FilterTier = "all" | "hot" | "warm" | "cold";

const WARMTH_ORDER: Record<string, number> = {
  hot: 0,
  warm: 1,
  cold: 2,
};

const PAGE_SIZE = 10;

const SUMMARY_CARDS: {
  label: string;
  kind: TierKind;
  countKey: "hot" | "warm" | "cold";
  color: string;
}[] = [
  { label: "Hot", kind: "hot", countKey: "hot", color: "text-status-hot" },
  {
    label: "Warm",
    kind: "warm",
    countKey: "warm",
    color: "text-status-warm",
  },
  {
    label: "Cold",
    kind: "cold",
    countKey: "cold",
    color: "text-status-cold",
  },
];

function WarmthBadge({ tier }: { tier: string | null }) {
  const colors: Record<string, string> = {
    hot: "bg-status-hot text-white",
    warm: "bg-status-warm text-white",
    cold: "bg-status-cold text-white",
  };
  // Warmth restructure: legacy null rows are treated as Hot (DB is NOT NULL
  // after the migration, so this is only a pre-migration fallback).
  const resolved = tier ?? "hot";
  const isTier =
    resolved === "hot" || resolved === "warm" || resolved === "cold";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[resolved] ?? "bg-muted text-muted-foreground"}`}
    >
      {isTier && <TierIcon kind={resolved as TierKind} className="h-3 w-3" />}
      {resolved}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WarmthClient({
  subscribers,
  summary,
  tier,
}: WarmthClientProps) {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("warmth_score");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<FilterTier>("all");

  // Story 20.1 AC2 — warmth page viewed (mount-only).
  useEffect(() => {
    capture("warmth_viewed");
  }, []);

  const filtered = useMemo(() => {
    let result = subscribers;
    if (filter !== "all") {
      result = result.filter((s) => s.warmth_score === filter);
    }
    return [...result].sort((a, b) => {
      if (sortField === "warmth_score") {
        const aOrder = WARMTH_ORDER[a.warmth_score ?? "hot"] ?? 0;
        const bOrder = WARMTH_ORDER[b.warmth_score ?? "hot"] ?? 0;
        return sortDir === "asc" ? aOrder - bOrder : bOrder - aOrder;
      }
      return sortDir === "asc"
        ? a.referral_count - b.referral_count
        : b.referral_count - a.referral_count;
    });
  }, [subscribers, filter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filtered.length);
  const visible = filtered.slice(start, end);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  }

  if (tier === "free") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-6 text-h2 text-foreground">Warmth</h1>
        <div className="relative rounded-[var(--card-radius)] border border-border bg-card p-8">
          <div className="space-y-4 opacity-50">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {SUMMARY_CARDS.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl font-semibold text-foreground">
                    —
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <TierIcon kind={item.kind} className={item.color} />
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[var(--card-radius)] bg-card/80">
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              Pro
            </span>
            <p className="text-body-sm text-muted-foreground">
              Upgrade to Pro to view warmth details
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-h2 text-foreground">Warmth</h1>

      {subscribers.length === 0 ? (
        <div className="rounded-[var(--card-radius)] border border-border bg-card p-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            No subscribers yet. Warmth data will appear once people join your
            waitlist.
          </p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
            {SUMMARY_CARDS.map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--card-radius)] border border-border bg-card p-4 text-center sm:p-5"
              >
                <div
                  className={`text-3xl font-semibold tabular-nums ${item.color}`}
                >
                  {summary[item.countKey]}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <TierIcon kind={item.kind} className={item.color} />
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Cold percentage */}
          <p className="mb-4 text-body-sm text-muted-foreground">
            {summary.total > 0
              ? `${Math.round((summary.cold / summary.total) * 100)}% cold`
              : "No data yet"}
          </p>

          {/* Filter + table */}
          <div className="rounded-[var(--card-radius)] border border-border bg-card">
            {/* Filter bar — count left, filter right (design guide §7) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
              <span className="text-body-sm text-muted-foreground">
                {filtered.length} subscriber
                {filtered.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="warmth-filter"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Filter:
                </label>
                <select
                  id="warmth-filter"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value as FilterTier);
                    setPage(0);
                  }}
                  className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
                >
                  <option value="all">All</option>
                  <option value="hot">Hot ({summary.hot})</option>
                  <option value="warm">Warm ({summary.warm})</option>
                  <option value="cold">Cold ({summary.cold})</option>
                </select>
              </div>
            </div>

            {/* Scroll region — horizontal scroll on narrow viewports */}
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Column headers */}
                <div className="grid grid-cols-[minmax(0,1fr)_110px_130px_90px] items-center gap-4 border-b border-border px-5 py-3">
                  <span className="text-left text-xs font-medium text-muted-foreground">
                    Email
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSort("warmth_score")}
                    className="text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Warmth{" "}
                    {sortField === "warmth_score"
                      ? sortDir === "asc"
                        ? "\u2191"
                        : "\u2193"
                      : ""}
                  </button>
                  <span className="text-left text-xs font-medium text-muted-foreground">
                    Last Engagement
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSort("referral_count")}
                    className="text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Referrals{" "}
                    {sortField === "referral_count"
                      ? sortDir === "asc"
                        ? "\u2191"
                        : "\u2193"
                      : ""}
                  </button>
                </div>

                {/* Rows */}
                {visible.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-body-sm text-muted-foreground">
                      No subscribers match this filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("all");
                        setPage(0);
                      }}
                      className="mt-3 rounded-lg border border-border px-4 py-2 text-body-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                    >
                      Show all
                    </button>
                  </div>
                ) : (
                  visible.map((sub, i) => (
                    <div
                      key={sub.id}
                      className={`grid grid-cols-[minmax(0,1fr)_110px_130px_90px] items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30 ${
                        i < visible.length - 1
                          ? "border-b border-border/50"
                          : ""
                      }`}
                    >
                      <span className="truncate text-body-sm font-medium text-foreground">
                        {sub.email}
                      </span>
                      <span className="flex justify-center">
                        <WarmthBadge tier={sub.warmth_score} />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(sub.last_engagement)}
                      </span>
                      <span className="text-center text-body-sm text-muted-foreground tabular-nums">
                        {sub.referral_count > 0 ? (
                          <span className="font-medium text-foreground">
                            {sub.referral_count}
                          </span>
                        ) : (
                          "0"
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
                <span>
                  Showing {start + 1}–{end} of {filtered.length}
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => setPage((p) => p - 1)}
                      className="font-medium text-accent transition-colors hover:text-accent/80 disabled:pointer-events-none disabled:text-muted-foreground"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      disabled={!hasNext}
                      onClick={() => setPage((p) => p + 1)}
                      className="font-medium text-accent transition-colors hover:text-accent/80 disabled:pointer-events-none disabled:text-muted-foreground"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
