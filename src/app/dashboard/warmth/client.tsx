"use client";

import { useMemo, useState } from "react";

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
  unscored: number;
  total: number;
}

interface WarmthClientProps {
  subscribers: Subscriber[];
  summary: WarmthSummary;
  tier: string;
}

type SortField = "warmth_score" | "referral_count";
type SortDir = "asc" | "desc";
type FilterTier = "all" | "hot" | "warm" | "cold" | "unscored";

const WARMTH_ORDER: Record<string, number> = {
  hot: 0,
  warm: 1,
  cold: 2,
};

const PAGE_SIZE = 10;

function WarmthBadge({ tier }: { tier: string | null }) {
  if (!tier) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Unscored
      </span>
    );
  }
  const colors: Record<string, string> = {
    hot: "bg-accent/10 text-accent",
    warm: "bg-status-warm text-white",
    cold: "bg-status-cold text-white",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[tier] ?? "bg-muted text-muted-foreground"}`}
    >
      {tier}
    </span>
  );
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

  const filtered = useMemo(() => {
    let result = subscribers;
    if (filter !== "all") {
      result = result.filter((s) => s.warmth_score === filter);
    }
    return [...result].sort((a, b) => {
      if (sortField === "warmth_score") {
        const aOrder = a.warmth_score ? (WARMTH_ORDER[a.warmth_score] ?? 3) : 3;
        const bOrder = b.warmth_score ? (WARMTH_ORDER[b.warmth_score] ?? 3) : 3;
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
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-h2 text-foreground">Warmth</h1>
        <div className="relative rounded-[var(--card-radius)] border border-border bg-card p-8">
          <div className="space-y-4 opacity-50">
            <div className="grid grid-cols-4 gap-4">
              {["Hot", "Warm", "Cold", "Unscored"].map((label) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-semibold text-foreground">
                    —
                  </div>
                  <div className="text-xs text-muted-foreground">{label}</div>
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
    <div className="mx-auto max-w-3xl px-6 py-8">
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
          <div className="mb-6 grid grid-cols-4 gap-4">
            {[
              { label: "Hot", count: summary.hot, color: "text-status-hot" },
              { label: "Warm", count: summary.warm, color: "text-status-warm" },
              { label: "Cold", count: summary.cold, color: "text-status-cold" },
              {
                label: "Unscored",
                count: summary.unscored,
                color: "text-muted-foreground",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--card-radius)] border border-border bg-card p-4 text-center"
              >
                <div className={`text-2xl font-semibold ${item.color}`}>
                  {item.count}
                </div>
                <div className="text-xs text-muted-foreground">
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
            {/* Filter bar */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Filter:
              </span>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as FilterTier);
                  setPage(0);
                }}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
              >
                <option value="all">All</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="unscored">Unscored</option>
              </select>
              <span className="ml-auto text-xs text-muted-foreground">
                {filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_100px_120px_80px] items-center gap-3 border-b border-border px-4 py-3">
              <span className="text-left text-xs font-medium text-muted-foreground">
                Email
              </span>
              <button
                type="button"
                onClick={() => toggleSort("warmth_score")}
                className="text-left text-xs font-medium text-muted-foreground hover:text-foreground"
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
                className="text-center text-xs font-medium text-muted-foreground hover:text-foreground"
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
              <div className="px-4 py-8 text-center text-body-sm text-muted-foreground">
                No subscribers match this filter.
              </div>
            ) : (
              visible.map((sub) => (
                <div
                  key={sub.id}
                  className="grid grid-cols-[1fr_100px_120px_80px] items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
                >
                  <span className="truncate text-body-sm font-medium text-foreground">
                    {sub.email}
                  </span>
                  <WarmthBadge tier={sub.warmth_score} />
                  <span className="text-xs text-muted-foreground">
                    {sub.last_engagement
                      ? new Date(sub.last_engagement).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )
                      : "Never"}
                  </span>
                  <span className="text-center text-body-sm text-muted-foreground">
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

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between text-body-sm text-muted-foreground">
              <span>
                Showing {start + 1}–{end} of {filtered.length}
              </span>
              <div className="flex items-center gap-3">
                {hasPrev && (
                  <button
                    type="button"
                    onClick={() => setPage((p) => p - 1)}
                    className="font-medium text-accent hover:text-accent/80"
                  >
                    ← Previous
                  </button>
                )}
                {hasNext && (
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="font-medium text-accent hover:text-accent/80"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
