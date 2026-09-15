"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Row = {
  id: string;
  email: string;
  display_name: string | null;
  referral_count: number;
  quality_score: number | null;
  rank: number;
  created_at: string;
  milestone_earned_count: number;
  milestone_total: number;
  milestone_next: { threshold: number; label: string } | null;
};

type SortKey =
  "rank" | "name" | "email" | "referral_count" | "quality_score" | "date";

function SortHeader({
  label,
  sortForKey,
  activeSort,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortForKey: SortKey;
  activeSort: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeSort === sortForKey;
  const arrow = active ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";
  return (
    <button
      type="button"
      onClick={() => onSort(sortForKey)}
      className={`text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${className ?? ""}`}
    >
      {label}
      {arrow}
    </button>
  );
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function formatMilestone(row: Row) {
  if (row.milestone_total === 0) return "\u2014";
  if (row.milestone_earned_count === row.milestone_total)
    return "\u2713 Complete";
  if (row.milestone_next) {
    return `${row.referral_count}/${row.milestone_next.threshold}`;
  }
  return `${row.milestone_earned_count}/${row.milestone_total}`;
}

export default function LeaderboardClient({
  rows,
  totalCount,
}: {
  rows: Row[];
  totalCount: number;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    const filtered = search
      ? rows.filter((r) => {
          const searchLower = search.toLowerCase();
          const name = r.display_name?.trim()?.toLowerCase() || "";
          const emailPrefix = r.email.split("@")[0].toLowerCase();
          return (
            r.email.toLowerCase().includes(searchLower) ||
            name.includes(searchLower) ||
            emailPrefix.includes(searchLower)
          );
        })
      : rows;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": {
          const aName = a.display_name?.trim() || a.email.split("@")[0];
          const bName = b.display_name?.trim() || b.email.split("@")[0];
          cmp = aName.localeCompare(bName);
          break;
        }
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "referral_count":
          cmp = b.referral_count - a.referral_count;
          break;
        case "quality_score":
          cmp = (b.quality_score ?? 0) - (a.quality_score ?? 0);
          break;
        case "date":
          cmp =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "rank":
        default:
          cmp = a.rank - b.rank;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, search]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-h2 text-foreground">Leaderboard</h1>

      <div className="rounded-[var(--card-radius)] border border-border bg-card">
        {/* Search bar */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3">
          <svg
            className="h-4 w-4 shrink-0 text-muted-foreground"
            fill="none"
            viewBox="0 0 16 16"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 16 16"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[48px_1fr_1fr_100px_100px_120px_120px] items-center gap-4 border-b border-border px-5 py-3">
          <SortHeader
            label="Rank"
            sortForKey="rank"
            activeSort={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            className="text-center"
          />
          <SortHeader
            label="Name"
            sortForKey="name"
            activeSort={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Email"
            sortForKey="email"
            activeSort={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <SortHeader
            label="Referrals"
            sortForKey="referral_count"
            activeSort={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            className="text-center"
          />
          <SortHeader
            label="Quality"
            sortForKey="quality_score"
            activeSort={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            className="text-center"
          />
          <span className="text-center text-xs font-medium text-muted-foreground">
            Milestone
          </span>
          <SortHeader
            label="Date"
            sortForKey="date"
            activeSort={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            className="text-center"
          />
        </div>

        {/* Rows */}
        {sorted.length === 0 ? (
          <div className="px-5 py-12 text-center text-body-sm text-muted-foreground">
            {search
              ? "No subscribers match your search."
              : "No subscribers yet. Share your waitlist to get started."}
          </div>
        ) : (
          <div>
            {sorted.map((row, i) => {
              const displayName =
                row.display_name?.trim() || row.email.split("@")[0];
              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[48px_1fr_1fr_100px_100px_120px_120px] items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30 ${
                    i < sorted.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <span className="text-center text-body-sm text-muted-foreground">
                    {row.rank}
                  </span>
                  <span className="text-body-sm font-medium text-foreground">
                    {displayName}
                  </span>
                  <Link
                    href={`/dashboard/subscribers/${row.id}`}
                    className="text-body-sm font-medium text-accent hover:underline"
                  >
                    {row.email}
                  </Link>
                  <span className="text-center text-body-sm font-semibold text-foreground">
                    {row.referral_count || "\u2014"}
                  </span>
                  <span className="text-center text-body-sm text-muted-foreground">
                    {row.quality_score !== null
                      ? `${row.quality_score}%`
                      : "\u2014"}
                  </span>
                  <span className="text-center text-body-sm text-muted-foreground">
                    {formatMilestone(row)}
                  </span>
                  <span className="text-center text-body-sm text-muted-foreground">
                    {formatDate(row.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {search
            ? `${sorted.length} result${sorted.length !== 1 ? "s" : ""}`
            : `${totalCount} subscriber${totalCount !== 1 ? "s" : ""}`}
        </div>
      </div>
    </div>
  );
}
