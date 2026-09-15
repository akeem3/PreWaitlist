"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "../../../../../components/ui/button";

type Row = {
  id: string;
  name: string;
  referral_count: number;
  qualified_count: number;
  rank: number;
};

const PAGE_SIZE = 10;
const NEIGHBORHOOD_SIZE = 5;

export function LeaderboardClient({
  rows,
  totalCount,
  subdomain,
  currentSubscriberId,
}: {
  rows: Row[];
  totalCount: number;
  subdomain: string;
  currentSubscriberId?: string;
}) {
  const [page, setPage] = useState(0);
  const [showFull, setShowFull] = useState(false);

  const currentRank = useMemo(() => {
    if (!currentSubscriberId) return null;
    const found = rows.find((r) => r.id === currentSubscriberId);
    return found?.rank ?? null;
  }, [currentSubscriberId, rows]);

  const neighborhoodRows = useMemo(() => {
    if (!currentRank) return [];
    const start = Math.max(0, currentRank - 1 - NEIGHBORHOOD_SIZE);
    const end = Math.min(rows.length, currentRank + NEIGHBORHOOD_SIZE);
    return rows.slice(start, end);
  }, [currentRank, rows]);

  const useNeighborhood =
    currentSubscriberId && currentRank && !showFull && rows.length > 0;

  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  const visible = useNeighborhood ? neighborhoodRows : rows.slice(start, end);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  if (rows.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-body text-muted-foreground">
          No subscribers yet. Be the first to join!
        </p>
        <div className="mt-4 flex justify-center">
          <Link href={`/${subdomain}`}>
            <Button variant="primary">Join the waitlist</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Toggle */}
      {currentSubscriberId && currentRank && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-body-sm text-muted-foreground">
            {showFull
              ? "Showing all subscribers"
              : `Your position: #${currentRank} of ${totalCount}`}
          </p>
          <button
            type="button"
            onClick={() => setShowFull(!showFull)}
            className="text-body-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            {showFull ? "Show my position" : "View full leaderboard"}
          </button>
        </div>
      )}

      {/* Card container */}
      <div className="rounded-[var(--card-radius)] border border-border bg-card overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[60px_1fr_100px] items-center gap-4 border-b border-border px-5 py-3 md:grid-cols-[80px_1fr_120px_140px] md:gap-6">
          <span className="text-center text-xs font-medium text-muted-foreground">
            Rank
          </span>
          <span className="text-center text-xs font-medium text-muted-foreground">
            Name
          </span>
          <span className="text-center text-xs font-medium text-muted-foreground">
            Referrals
          </span>
          <span className="hidden text-center text-xs font-medium text-muted-foreground md:block">
            Quality
          </span>
        </div>

        {/* Rows */}
        {visible.map((row, i) => {
          const isYou = currentSubscriberId && row.id === currentSubscriberId;
          return (
            <div
              key={row.id}
              className={`grid grid-cols-[60px_1fr_100px] items-center gap-4 px-5 py-4 md:grid-cols-[80px_1fr_120px_140px] md:gap-6 ${
                isYou ? "border-l-2 border-l-accent bg-accent/5" : ""
              } ${i < visible.length - 1 ? "border-b border-border/50" : ""}`}
            >
              <span className="text-center text-body-sm text-muted-foreground">
                {row.rank}
              </span>
              <span className="text-center text-body-sm font-medium text-foreground">
                {row.name}
                {isYou && (
                  <span className="ml-2 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    You
                  </span>
                )}
              </span>
              <span className="text-center text-body-sm font-semibold text-foreground">
                {row.referral_count}
              </span>
              <span className="hidden text-center text-body-sm text-muted-foreground md:block">
                {row.qualified_count} qualified
              </span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {!useNeighborhood && (
        <div className="mt-4 flex items-center justify-center gap-3 text-body-sm text-muted-foreground">
          <span>
            Showing {start + 1}–{end} of {totalCount}
          </span>
          {hasPrev && (
            <button
              onClick={() => setPage((p) => p - 1)}
              className="text-body-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              ← Previous
            </button>
          )}
          {hasNext && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="text-body-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
