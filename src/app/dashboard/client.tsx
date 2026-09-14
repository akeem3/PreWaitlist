"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "../../../components/dashboard/sidebar";
import { createClient } from "../../../src/lib/supabase/client";

const SignupChart = dynamic(
  () => import("../../../components/dashboard/signup-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-(--card-radius) border border-border bg-card p-5">
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
  qual_answers: Record<string, string> | null;
}

interface DashboardClientProps {
  liveUrl: string;
  waitlistName: string | null;
  logoUrl: string | null;
  tier: string;
  subdomain: string;
  subscribers?: Subscriber[];
  stats?: {
    totalSignups: number;
    referralPercentage: number | null;
    todaySignups: number;
  };
  coldThreshold: number;
}

const TABLE_COLUMNS = ["#", "Email", "Date", "Warmth", "Referrals", "Quality"];

const WARMTH_ORDER: Record<string, number> = {
  hot: 0,
  warm: 1,
  cold: 2,
};

function formatStat(value: number): string {
  return value > 0 ? String(value) : "\u2014";
}

function computeDelta(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "\u2014";
  if (previous === 0) return "\u2191 new";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return `\u2191 ${pct}% vs last week`;
  if (pct < 0) return `\u2193 ${Math.abs(pct)}% vs last week`;
  return "\u2014 no change";
}

export default function DashboardClient({
  liveUrl,
  waitlistName,
  logoUrl,
  tier,
  subdomain,
  subscribers = [],
  stats,
  coldThreshold,
}: DashboardClientProps) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<
    "position" | "referral_count" | "quality_score" | "warmth_score"
  >("position");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [warmthFilter, setWarmthFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statsData, setStatsData] = useState<{
    current: { total: number; referrals: number; today: number };
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

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStatsData)
      .catch(() => {});
    fetch("/api/dashboard/warmth")
      .then((r) => r.json())
      .then((json) => {
        if (json.total !== undefined) setWarmthData(json);
      })
      .catch(() => {});
  }, []);

  const sortedSubscribers = useMemo(() => {
    return [...subscribers].sort((a, b) => {
      if (sortField === "referral_count") {
        return sortDir === "desc"
          ? b.referral_count - a.referral_count
          : a.referral_count - b.referral_count;
      }
      if (sortField === "quality_score") {
        const aVal = a.quality_score ?? -1;
        const bVal = b.quality_score ?? -1;
        return sortDir === "desc" ? bVal - aVal : aVal - bVal;
      }
      if (sortField === "warmth_score") {
        const aVal = a.warmth_score ? (WARMTH_ORDER[a.warmth_score] ?? 3) : 3;
        const bVal = b.warmth_score ? (WARMTH_ORDER[b.warmth_score] ?? 3) : 3;
        return sortDir === "desc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? a.position - b.position
        : b.position - a.position;
    });
  }, [subscribers, sortField, sortDir]);

  const filteredSubscribers = useMemo(() => {
    let result = sortedSubscribers;
    if (warmthFilter === "unscored") {
      result = result.filter((s) => !s.warmth_score);
    } else if (warmthFilter !== "all") {
      result = result.filter((s) => s.warmth_score === warmthFilter);
    }
    if (searchQuery) {
      result = result.filter((s) =>
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [sortedSubscribers, searchQuery, warmthFilter]);

  function handleSort(
    field: "position" | "referral_count" | "quality_score" | "warmth_score"
  ) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(
        field === "quality_score" ||
          field === "warmth_score" ||
          field === "referral_count"
          ? "desc"
          : "asc"
      );
    }
  }

  function toggleRow(id: string) {
    if (expandedRows.has(id)) {
      router.push(`/dashboard/subscribers/${id}`);
      return;
    }
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(`https://${liveUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  function handleExportCsv() {
    const headers = [
      "Position",
      "Email",
      "Referral Code",
      "Referrals",
      "Quality Score",
      "Warmth",
      "Signup Date",
    ];
    const rows = filteredSubscribers.map((s) => [
      s.position,
      s.email,
      s.referral_code,
      s.referral_count,
      s.quality_score ?? "",
      s.warmth_score ?? "Unscored",
      s.created_at,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${subdomain}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isEmpty = subscribers.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        waitlistName={waitlistName}
        logoUrl={logoUrl}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSignOut={handleSignOut}
        tier={tier}
      />

      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 rounded-lg border border-border bg-card p-2 lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5H17M3 10H17M3 15H17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <main className="min-h-screen lg:ml-67">
        <div className="border-b border-border bg-background px-6 py-4">
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

              <div className="mb-8 rounded-(--card-radius) border border-border bg-card p-5">
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
          ) : null}

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 text-h3 text-foreground">
                {stats ? formatStat(stats.totalSignups) : "\u2014"}
              </div>
              <div className="text-caption text-muted-foreground">
                Total signups
              </div>
              {statsData && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {computeDelta(
                    statsData.current.total,
                    statsData.previous.total
                  )}
                </div>
              )}
            </div>
            <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 text-h3 text-foreground">
                {stats && stats.referralPercentage !== null
                  ? `${stats.referralPercentage}%`
                  : "\u2014"}
              </div>
              <div className="text-caption text-muted-foreground">
                Referral %
              </div>
              {statsData && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {computeDelta(
                    statsData.current.referrals,
                    statsData.previous.referrals
                  )}
                </div>
              )}
            </div>
            <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 text-h3 text-foreground">
                {stats ? formatStat(stats.todaySignups) : "\u2014"}
              </div>
              <div className="text-caption text-muted-foreground">Today</div>
            </div>
            <div className="rounded-(--card-radius) border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 flex items-center justify-center gap-1.5 text-h3 text-foreground">
                {tier === "free" && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-muted-foreground"
                  >
                    <rect
                      x="2.5"
                      y="5"
                      width="7"
                      height="5.5"
                      rx="1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M4 5V3.5C4 2.4 4.9 1.5 6 1.5C7.1 1.5 8 2.4 8 3.5V5"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {warmthData && tier === "pro" ? (
                  <span className="text-body-sm font-medium">
                    {warmthData.hot} Hot, {warmthData.warm} Warm
                  </span>
                ) : (
                  "\u2014"
                )}
              </div>
              <div className="text-caption text-muted-foreground">Warmth</div>
            </div>
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
                <SignupChart subdomain={subdomain} />
              </div>

              <div className="mb-6">
                <TopReferrers subscribers={subscribers} />
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <QualificationPanel subdomain={subdomain} />
                <WarmthPanel tier={tier} warmthData={warmthData} />
              </div>
            </>
          )}

          <div className="rounded-(--card-radius) border border-border bg-card">
            <div className="px-5 pt-5">
              <input
                type="text"
                placeholder="Search by email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4 w-full rounded-xl border border-border bg-background px-4 py-2 text-body-sm text-foreground placeholder:text-muted-foreground"
              />
              <div className="mb-4 flex items-center justify-between">
                <p className="text-body-sm text-muted-foreground">
                  {filteredSubscribers.length} subscriber
                  {filteredSubscribers.length !== 1 ? "s" : ""}
                  {warmthFilter !== "all" ? ` (${warmthFilter})` : ""}
                </p>
                <div className="flex items-center gap-3">
                  <select
                    value={warmthFilter}
                    onChange={(e) => setWarmthFilter(e.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-body-sm text-foreground"
                  >
                    <option value="all">All warmth</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                    <option value="unscored">Unscored</option>
                  </select>
                  {tier === "pro" && (
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-body-sm text-foreground transition-colors hover:bg-muted/50"
                    >
                      Export CSV
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="grid min-w-[600px] grid-cols-6 gap-4 border-b border-border px-5 py-3">
                {TABLE_COLUMNS.map((col) => {
                  const field =
                    col === "Referrals"
                      ? "referral_count"
                      : col === "#"
                        ? "position"
                        : col === "Quality"
                          ? "quality_score"
                          : col === "Warmth"
                            ? "warmth_score"
                            : null;
                  const isActive = field === sortField;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => field && handleSort(field)}
                      className={`text-left text-body-sm font-medium transition-colors ${
                        field
                          ? "cursor-pointer hover:text-foreground"
                          : "cursor-default"
                      } ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {col}
                      {isActive && (
                        <span className="ml-1">
                          {sortDir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {filteredSubscribers.length > 0 ? (
                <div>
                  {filteredSubscribers.map((sub) => (
                    <div key={sub.id}>
                      <div
                        onClick={() => toggleRow(sub.id)}
                        className="grid min-w-[600px] grid-cols-6 gap-4 border-b border-border px-5 py-3 cursor-pointer transition-colors hover:bg-muted/30"
                      >
                        <span className="text-body-sm text-muted-foreground">
                          {sub.position}
                        </span>
                        <span className="truncate text-body-sm text-foreground">
                          {sub.email}
                        </span>
                        <span className="text-body-sm text-muted-foreground">
                          {sub.created_at.split("T")[0]}
                        </span>
                        <span className="text-body-sm">
                          {sub.warmth_score ? (
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                sub.warmth_score === "hot"
                                  ? "bg-accent/10 text-accent"
                                  : sub.warmth_score === "warm"
                                    ? "bg-status-warm text-white"
                                    : "bg-status-cold text-white"
                              }`}
                            >
                              {sub.warmth_score}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unscored
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-right text-body-sm ${
                            sub.referral_count === 0
                              ? "text-muted-foreground"
                              : "font-medium text-foreground"
                          }`}
                        >
                          {sub.referral_count}
                        </span>
                        <span
                          className={`text-right text-body-sm ${
                            sub.quality_score === null
                              ? "text-muted-foreground"
                              : "font-medium text-foreground"
                          }`}
                        >
                          {sub.quality_score !== null
                            ? `${sub.quality_score}%`
                            : "\u2014"}
                        </span>
                      </div>
                      {expandedRows.has(sub.id) && (
                        <div className="border-b border-border bg-muted/20 px-5 py-3">
                          <div className="grid grid-cols-3 gap-4 text-body-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Position:{" "}
                              </span>
                              <span className="font-medium text-foreground">
                                #{sub.position}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Referrals:{" "}
                              </span>
                              <span className="font-medium text-foreground">
                                {sub.referral_count}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Signed up:{" "}
                              </span>
                              <span className="font-medium text-foreground">
                                {sub.created_at.split("T")[0]}
                              </span>
                            </div>
                          </div>
                          {sub.qual_answers &&
                            Object.keys(sub.qual_answers).length > 0 && (
                              <div className="mt-3 border-t border-border pt-3">
                                <p className="mb-1 text-xs font-medium text-muted-foreground">
                                  Qualification Answers
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {Object.entries(sub.qual_answers).map(
                                    ([q, a]) => (
                                      <div key={q}>
                                        <span className="text-muted-foreground">
                                          {q}:{" "}
                                        </span>
                                        <span className="text-foreground">
                                          {String(a)}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/subscribers/${sub.id}`);
                            }}
                            className="mt-3 text-xs font-medium text-accent hover:underline"
                          >
                            View full profile →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-20 items-center justify-center">
                  <span className="text-body-sm text-muted-foreground">
                    {searchQuery
                      ? "No subscribers match your search."
                      : "No subscribers yet. Share your link to get started."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
