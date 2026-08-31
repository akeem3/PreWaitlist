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
  const [page, setPage] = useState(0);

  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  const visible = rows.slice(start, end);
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
      {/* Column headers */}
      <div className="grid grid-cols-[48px_1fr_80px] gap-4 px-4 pb-2 border-b border-foreground/15 md:grid-cols-[80px_1fr_120px_140px] md:gap-8">
        <span className="text-center text-body-sm font-medium text-muted-foreground">
          Rank
        </span>
        <span className="text-center text-body-sm font-medium text-muted-foreground">
          Name
        </span>
        <span className="text-center text-body-sm font-medium text-muted-foreground">
          Referrals
        </span>
        <span className="hidden text-center text-body-sm font-medium text-muted-foreground md:block">
          Quality
        </span>
      </div>

      {/* Rows */}
      {visible.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[48px_1fr_80px] items-center gap-4 px-4 py-4 border-b border-foreground/15 md:grid-cols-[80px_1fr_120px_140px] md:gap-8"
        >
          <span className="text-center text-body text-muted-foreground">
            {row.rank}
          </span>
          <span className="text-center text-body font-medium text-foreground">
            {row.name}
          </span>
          <span className="text-center text-body font-semibold text-foreground">
            {row.referral_count}
          </span>
          <span className="hidden text-center text-body text-muted-foreground md:block">
            {row.qualified_count} qualified
          </span>
        </div>
      ))}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center gap-3 text-body-sm text-muted-foreground">
        <span>
          Showing {start + 1}–{end} of {totalCount}
        </span>
        {hasPrev && (
          <button
            onClick={() => setPage((p) => p - 1)}
            className="text-body-sm font-medium text-accent hover:text-accent/80"
          >
            ← Previous
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="text-body-sm font-medium text-accent hover:text-accent/80"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
