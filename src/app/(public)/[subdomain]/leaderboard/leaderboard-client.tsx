"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../../../components/ui/button";

type Row = {
  id: string;
  name: string;
  referral_count: number;
  qualified_count: number;
  rank: number;
};

const PAGE_SIZE = 10;

export function LeaderboardClient({
  rows,
  totalCount,
  subdomain,
}: {
  rows: Row[];
  totalCount: number;
  subdomain: string;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

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
      {/* Column headers */}
      <div className="grid grid-cols-[60px_1fr_100px_120px] px-4 pb-2 border-b border-foreground/15">
        <span className="text-caption text-muted-foreground">Rank</span>
        <span className="text-caption text-muted-foreground">Name</span>
        <span className="text-caption text-muted-foreground text-right">
          Referrals
        </span>
        <span className="text-caption text-muted-foreground text-right">
          Quality
        </span>
      </div>

      {/* Rows */}
      {visible.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[60px_1fr_100px_120px] items-center px-4 py-4 border-b border-foreground/15"
        >
          <span className="text-body text-muted-foreground">{row.rank}</span>
          <span className="text-body font-medium text-foreground">
            {row.name}
          </span>
          <span className="text-body font-semibold text-foreground text-right">
            {row.referral_count}
          </span>
          <span className="text-body text-muted-foreground text-right">
            {row.qualified_count} qualified
          </span>
        </div>
      ))}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center gap-3 text-body-sm text-muted-foreground">
        <span>
          1–{visible.length} of {totalCount}
        </span>
        {hasMore && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="text-body-sm font-medium text-accent hover:text-accent/80"
          >
            View More
          </button>
        )}
      </div>
    </div>
  );
}
