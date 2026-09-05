"use client";

import { anonymizeEmail } from "../../src/lib/format";

interface Subscriber {
  id: string;
  email: string;
  referral_count: number;
  quality_score: number | null;
}

interface TopReferrersProps {
  subscribers: Subscriber[];
}

export default function TopReferrers({ subscribers }: TopReferrersProps) {
  const referrers = subscribers
    .filter((s) => s.referral_count > 0)
    .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
    .slice(0, 5);

  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Top Referrers
      </h3>
      {referrers.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          Share your link to get referrals
        </p>
      ) : (
        <div className="space-y-3">
          {referrers.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-5 text-right text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span className="truncate text-sm text-foreground">
                  {anonymizeEmail(r.email)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {r.referral_count} referral
                  {r.referral_count !== 1 ? "s" : ""}
                </span>
                <span className="w-10 text-right text-xs font-medium text-foreground">
                  {r.quality_score !== null ? `${r.quality_score}%` : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
