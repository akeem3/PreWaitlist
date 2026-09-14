"use client";

import { useState } from "react";

interface Row {
  id: string;
  email: string;
  referral_count: number;
  quality_score: number | null;
  created_at: string;
  rank: number;
}

interface LeaderboardClientProps {
  rows: Row[];
  totalCount: number;
}

const PAGE_SIZE = 10;

export default function LeaderboardClient({
  rows,
  totalCount,
}: LeaderboardClientProps) {
  const [page, setPage] = useState(0);

  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  const visible = rows.slice(start, end);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-h2 text-foreground">Leaderboard</h1>

      {rows.length === 0 ? (
        <div className="rounded-[var(--card-radius)] border border-border bg-card p-8 text-center">
          <p className="text-body-sm text-muted-foreground">
            No subscribers yet. Share your waitlist to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[var(--card-radius)] border border-border bg-card">
            {/* Column headers */}
            <div className="grid grid-cols-[48px_1fr_80px_80px_100px] items-center gap-3 border-b border-border px-4 py-3">
              <span className="text-center text-xs font-medium text-muted-foreground">
                Rank
              </span>
              <span className="text-left text-xs font-medium text-muted-foreground">
                Email
              </span>
              <span className="text-center text-xs font-medium text-muted-foreground">
                Referrals
              </span>
              <span className="text-center text-xs font-medium text-muted-foreground">
                Quality
              </span>
              <span className="text-center text-xs font-medium text-muted-foreground">
                Date
              </span>
            </div>

            {/* Rows */}
            {visible.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[48px_1fr_80px_80px_100px] items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
              >
                <span className="text-center text-body-sm text-muted-foreground">
                  {row.rank}
                </span>
                <span className="truncate text-body-sm font-medium text-foreground">
                  {row.email}
                </span>
                <span className="text-center text-body-sm font-semibold text-foreground">
                  {row.referral_count}
                </span>
                <span className="text-center text-body-sm text-muted-foreground">
                  {row.quality_score !== null
                    ? `${row.quality_score}`
                    : "\u2014"}
                </span>
                <span className="text-center text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-body-sm text-muted-foreground">
            <span>
              Showing {start + 1}\u2013{end} of {totalCount} subscribers
            </span>
            <div className="flex items-center gap-3">
              {hasPrev && (
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  className="font-medium text-accent hover:text-accent/80"
                >
                  \u2190 Previous
                </button>
              )}
              {hasNext && (
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="font-medium text-accent hover:text-accent/80"
                >
                  Next \u2192
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
