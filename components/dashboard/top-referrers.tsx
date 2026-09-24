"use client";

import Link from "next/link";
import { anonymizeEmail } from "../../src/lib/format";
import Panel from "./panel";

interface Subscriber {
  id: string;
  email: string;
  referral_count: number;
}

interface TopReferrersProps {
  subscribers: Subscriber[];
  founderEmail?: string;
  waitlistId?: string;
}

const RANK_COLORS = [
  "bg-[#FFD700] text-[#8B6914]",
  "bg-[#C0C0C0] text-[#5A5A5A]",
  "bg-[#CD7F32] text-white",
];

export default function TopReferrers({
  subscribers,
  founderEmail,
  waitlistId,
}: TopReferrersProps) {
  const referrers = subscribers
    .filter((s) => s.referral_count > 0)
    .sort((a, b) => b.referral_count - a.referral_count)
    .slice(0, 4);

  const topCount = referrers[0]?.referral_count ?? 0;
  const founderInTop = founderEmail
    ? referrers.find((r) => r.email === founderEmail)
    : null;
  const founderRank = founderInTop ? referrers.indexOf(founderInTop) + 1 : null;
  const gapToTop =
    founderRank && founderRank > 1
      ? topCount - (referrers[founderRank - 1]?.referral_count ?? 0)
      : null;

  return (
    <Panel
      title="Top Referrers"
      action={
        <Link
          href={`/dashboard/leaderboard${waitlistId ? `?wid=${waitlistId}` : ""}`}
          className="text-body-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all &rarr;
        </Link>
      }
    >
      {referrers.length === 0 ? (
        <div className="py-4 text-center">
          <p className="mb-3 text-body-sm text-muted-foreground">
            No referrals yet &mdash; share your waitlist link to get started
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect
                  x="3.5"
                  y="3.5"
                  width="6"
                  height="6"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M8.5 3.5V2.5C8.5 2 8 1.5 7.5 1.5H2.5C2 1.5 1.5 2 1.5 2.5V7.5C1.5 8 2 8.5 2.5 8.5H3.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
              Copy link
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {referrers.map((r, i) => {
              const isFounder = r.email === founderEmail;
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 ${
                    isFounder ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        i < 3
                          ? RANK_COLORS[i]
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="truncate text-sm text-foreground">
                      {anonymizeEmail(r.email)}
                      {isFounder && (
                        <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {r.referral_count} referral
                    {r.referral_count !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          {gapToTop !== null && gapToTop > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {gapToTop} more referral{gapToTop !== 1 ? "s" : ""} to reach #1
            </p>
          )}
        </>
      )}
    </Panel>
  );
}
