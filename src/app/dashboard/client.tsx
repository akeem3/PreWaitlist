"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useDashboardTier, useUpgradeModal } from "./shell";

const SignupChart = dynamic(
  () => import("../../../components/dashboard/signup-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-50 animate-pulse rounded bg-muted" />
      </div>
    ),
  }
);

const QualificationPanel = dynamic(
  () => import("../../../components/dashboard/qualification-panel"),
  {
    ssr: false,
  }
);

const TopReferrers = dynamic(
  () => import("../../../components/dashboard/top-referrers"),
  {
    ssr: false,
  }
);

const WarmthPanel = dynamic(
  () => import("../../../components/dashboard/warmth-panel"),
  {
    ssr: false,
  }
);

const WarningBanner = dynamic(
  () => import("../../../components/dashboard/warning-banner"),
  {
    ssr: false,
  }
);

interface Subscriber {
  id: string;
  email: string;
  position: number;
  referral_code: string;
  referral_count: number;
  created_at: string;
  warmth_score: string | null;
  quality_score: number | null;
  is_bounced?: boolean;
  display_name?: string | null;
}

interface DashboardClientProps {
  liveUrl: string;
  tier?: string;
  subdomain: string;
  subscribers?: Subscriber[];
  founderEmail?: string;
  displayName?: string;
  stats?: {
    totalSignups: number;
    referralPercentage: number | null;
    todaySignups: number;
  };
  coldThreshold: number;
  waitlistId?: string;
}

function formatStat(value: number): string {
  return value > 0 ? String(value) : "\u2014";
}

type DeltaTone = "up" | "down" | "flat";

interface Delta {
  text: string;
  tone: DeltaTone;
}

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  up: "text-accent",
  down: "text-destructive",
  flat: "text-muted-foreground",
};

function computeDelta(current: number, previous: number): Delta {
  if (previous === 0 && current === 0) return { text: "\u2014", tone: "flat" };
  if (previous === 0) return { text: "\u2191 new", tone: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { text: `\u2191 ${pct}% vs last week`, tone: "up" };
  if (pct < 0)
    return { text: `\u2193 ${Math.abs(pct)}% vs last week`, tone: "down" };
  return { text: "\u2014 no change", tone: "flat" };
}

function computeTodayDelta(current: number, yesterday: number): Delta {
  if (yesterday === 0 && current === 0) return { text: "\u2014", tone: "flat" };
  if (yesterday === 0 && current > 0)
    return { text: "\u2191 new today", tone: "up" };
  const diff = current - yesterday;
  if (diff > 0) return { text: `\u2191 ${diff} vs yesterday`, tone: "up" };
  if (diff < 0)
    return { text: `\u2193 ${Math.abs(diff)} vs yesterday`, tone: "down" };
  return { text: "\u2014 same as yesterday", tone: "flat" };
}

function DeltaText({ value }: { value: Delta }) {
  return (
    <div className={`mt-1 text-xs ${DELTA_TONE_CLASS[value.tone]}`}>
      {value.text}
    </div>
  );
}

export default function DashboardClient({
  liveUrl,
  tier: tierProp,
  subdomain,
  subscribers = [],
  founderEmail,
  displayName,
  stats,
  coldThreshold,
  waitlistId,
}: DashboardClientProps) {
  const tier = useDashboardTier() || tierProp || "free";
  const triggerUpgrade = useUpgradeModal();
  const [copied, setCopied] = useState(false);
  const [statsData, setStatsData] = useState<{
    current: {
      total: number;
      referrals: number;
      today: number;
      yesterday: number;
    };
    previous: { total: number; referrals: number };
  } | null>(null);
  const [warmthData, setWarmthData] = useState<{
    hot: number;
    warm: number;
    cold: number;
    unscored: number;
    total: number;
  } | null>(null);
  const router = useRouter();

  // Fetch stats + warmth data (reused by mount, visibility, and interval)
  const widParam = waitlistId ? `?waitlist_id=${waitlistId}` : "";
  const refreshData = () => {
    fetch(`/api/dashboard/stats${widParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.current) setStatsData(data);
      })
      .catch(() => {});
    // AC2: never hit the warmth API without waitlist_id (it 400s). The page
    // redirects founders with no waitlist, but guard the optional prop too.
    if (waitlistId) {
      fetch(`/api/dashboard/warmth${widParam}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.total !== undefined) setWarmthData(json);
        })
        .catch(() => {});
    }
  };

  // Initial load
  useEffect(() => {
    refreshData();
  }, []);

  // Track mounted state to prevent router.refresh() firing during navigation
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-refresh: re-fetch data when tab regains focus
  useEffect(() => {
    function handleVisibilityChange() {
      if (mountedRef.current && document.visibilityState === "visible") {
        router.refresh();
        refreshData();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  // Auto-refresh: re-fetch data every 60 seconds while tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (mountedRef.current && document.visibilityState === "visible") {
        router.refresh();
        refreshData();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [router]);

  const isEmpty = subscribers.length === 0;

  function handleCopy() {
    navigator.clipboard.writeText(`https://${liveUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-body-sm font-medium text-accent">
              {liveUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
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
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {tier === "pro" ? (
              <Link
                href="/onboarding/1"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2V10M2 6H10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Add New Waitlist
              </Link>
            ) : waitlistId ? (
              <button
                type="button"
                onClick={() => triggerUpgrade("subscriber_cap")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-accent bg-transparent px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2V10M2 6H10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Add new waitlist
              </button>
            ) : null}
            <Link
              href="/dashboard/settings/profile"
              className="group relative inline-flex items-center rounded-full transition-colors hover:bg-muted"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {(displayName || founderEmail || "U").charAt(0).toUpperCase()}
              </span>
              <span className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 max-w-[min(90vw,20rem)] truncate rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground opacity-0 shadow-[var(--shadow-float)] transition-opacity duration-150 group-hover:opacity-100">
                {founderEmail || displayName || "Profile"}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {isEmpty ? (
          <>
            <h1 className="mb-2 text-h2 text-foreground">
              Your waitlist is live at {liveUrl}
            </h1>
            <p className="mb-6 text-body text-muted-foreground">
              Share your link and start collecting signups.
            </p>

            <div className="mb-8 flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-body-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Copy Link
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect
                    x="4"
                    y="4"
                    width="8"
                    height="8"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M10 4V2.5C10 2 9.5 1.5 9 1.5H3.5C3 1.5 2.5 2 2.5 2.5V9C2.5 9.5 3 10 3.5 10H4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </button>
              <a
                href={`https://${liveUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                View Public Page
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M5.5 2.5H3C2.5 2.5 2 3 2 3.5V11C2 11.5 2.5 12 3 12H11C11.5 12 12 11.5 12 11V8.5M9 2.5H12M12 2.5V5.5M12 2.5L7 7.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            <div className="mb-8 rounded-[var(--card-radius)] border border-border bg-card p-5">
              <h2 className="mb-3 text-body-sm font-semibold text-foreground">
                What to do next
              </h2>
              <ol className="space-y-3">
                <li className="flex items-start gap-3 text-body-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                    1
                  </span>
                  Share your page in 1–2 relevant communities
                </li>
                <li className="flex items-start gap-3 text-body-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                    2
                  </span>
                  Tell 5 people personally — personal asks convert 3x better
                </li>
                <li className="flex items-start gap-3 text-body-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                    3
                  </span>
                  Post on social with your referral link
                </li>
              </ol>
            </div>
          </>
        ) : (
          <h1 className="mb-6 text-h2 text-foreground">Overview</h1>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link
            href={`/dashboard/leaderboard${waitlistId ? `?wid=${waitlistId}` : ""}`}
            className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-muted/30"
          >
            <div className="mb-1 text-h3 text-foreground">
              {stats ? formatStat(stats.totalSignups) : "\u2014"}
            </div>
            <div className="text-caption text-muted-foreground">
              Total signups
            </div>
            {statsData?.current && (
              <DeltaText
                value={computeDelta(
                  statsData.current.total,
                  statsData.previous.total
                )}
              />
            )}
          </Link>
          <Link
            href={`/dashboard/leaderboard${waitlistId ? `?wid=${waitlistId}` : ""}`}
            className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-muted/30"
          >
            <div className="mb-1 text-h3 text-foreground">
              {stats && stats.referralPercentage !== null
                ? `${stats.referralPercentage}%`
                : "\u2014"}
            </div>
            <div className="text-caption text-muted-foreground">Referral %</div>
            {statsData?.current && (
              <DeltaText
                value={computeDelta(
                  statsData.current.referrals,
                  statsData.previous.referrals
                )}
              />
            )}
          </Link>
          <Link
            href={`/dashboard/leaderboard${waitlistId ? `?wid=${waitlistId}` : ""}`}
            className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-muted/30"
          >
            <div className="mb-1 text-h3 text-foreground">
              {stats ? formatStat(stats.todaySignups) : "\u2014"}
            </div>
            <div className="text-caption text-muted-foreground">Today</div>
            {statsData?.current && (
              <DeltaText
                value={computeTodayDelta(
                  statsData.current.today,
                  statsData.current.yesterday
                )}
              />
            )}
          </Link>
          {(() => {
            const warmthContent = (
              <>
                <div className="mb-1 text-h3 text-foreground">
                  {warmthData ? (
                    <>
                      <span className="text-accent">{warmthData.hot}</span>
                      <span className="text-body-sm text-muted-foreground">
                        {" "}
                        /{" "}
                      </span>
                      <span className="text-status-warm">
                        {warmthData.warm}
                      </span>
                      <span className="text-body-sm text-muted-foreground">
                        {" "}
                        /{" "}
                      </span>
                      <span className="text-status-cold">
                        {warmthData.cold}
                      </span>
                    </>
                  ) : (
                    "\u2014"
                  )}
                </div>
                <div className="text-caption text-muted-foreground">
                  Hot / Warm / Cold
                </div>
                {warmthData && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {warmthData.unscored > 0
                      ? `${warmthData.unscored} unscored`
                      : `${warmthData.total} total`}
                  </div>
                )}
              </>
            );

            if (tier === "pro") {
              return (
                <Link
                  href={`/dashboard/warmth${waitlistId ? `?wid=${waitlistId}` : ""}`}
                  className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-muted/30"
                >
                  {warmthContent}
                </Link>
              );
            }

            return (
              <button
                type="button"
                onClick={() => triggerUpgrade("warmth")}
                className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-muted/30"
              >
                {warmthContent}
              </button>
            );
          })()}
        </div>

        {!isEmpty && (
          <>
            <div className="mb-6">
              <WarningBanner
                coldThreshold={coldThreshold}
                warmthData={warmthData}
              />
            </div>

            <div className="mb-6">
              <SignupChart subdomain={subdomain} waitlistId={waitlistId} />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <QualificationPanel
                subdomain={subdomain}
                waitlistId={waitlistId}
                variant="overview"
              />
              <WarmthPanel
                tier={tier}
                warmthData={warmthData}
                onUpgradeClick={() => triggerUpgrade("warmth")}
              />
            </div>

            {tier === "pro" && (
              <div className="mb-6">
                <TopReferrers
                  subscribers={subscribers}
                  founderEmail={founderEmail}
                  waitlistId={waitlistId}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
