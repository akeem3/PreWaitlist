"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Sidebar } from "../../../components/dashboard/sidebar";

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
        <div className="h-[200px] animate-pulse rounded bg-muted" />
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
}

const CHECKLIST_ITEMS = [
  {
    id: "community",
    label: "Post in one relevant community",
    autoCheck: false,
  },
  {
    id: "personal",
    label: "Tell 5 people personally",
    autoCheck: false,
  },
];

const TABLE_COLUMNS = ["#", "Email", "Date", "Referrals", "Quality", "Warmth"];

const WARMTH_ORDER: Record<string, number> = {
  hot: 0,
  warm: 1,
  cold: 2,
};

function formatStat(value: number): string {
  return value > 0 ? String(value) : "—";
}

export default function DashboardClient({
  liveUrl,
  waitlistName,
  logoUrl,
  tier,
  subdomain,
  subscribers = [],
  stats,
}: DashboardClientProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<
    "position" | "referral_count" | "quality_score" | "warmth_score"
  >("position");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [warmthFilter, setWarmthFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

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

  function handleShareTwitter() {
    const text = encodeURIComponent(
      `Check out our waitlist: https://${liveUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
    setCheckedItems((prev) => new Set(prev).add("community"));
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        waitlistName={waitlistName}
        logoUrl={logoUrl}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSignOut={handleSignOut}
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

      <main className="min-h-screen lg:ml-[268px]">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={handleShareTwitter}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Share on Twitter
            </button>
            {checkedItems.has("community") && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-accent"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 8L7 10L11 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="mb-6 text-h2 text-foreground">
            Get your first signups
          </h1>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                handleCopy();
                setCheckedItems((prev) => new Set(prev).add("community"));
              }}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-body font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Share your link
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 7H13M8 2L13 7L8 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
            <ul className="space-y-3">
              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = checkedItems.has(item.id);
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                        isChecked
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-background"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2.5 6L5 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-body-sm ${
                        isChecked
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mb-6 text-body-sm text-muted-foreground">
            Preview — this is what it&apos;ll look like once signups arrive
          </p>

          <div className="mb-6 grid grid-cols-4 gap-3">
            <div className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 text-h3 text-foreground">
                {stats ? formatStat(stats.totalSignups) : "—"}
              </div>
              <div className="text-caption text-muted-foreground">
                Total signups
              </div>
            </div>
            <div className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 text-h3 text-foreground">
                {stats && stats.referralPercentage !== null
                  ? `${stats.referralPercentage}%`
                  : "—"}
              </div>
              <div className="text-caption text-muted-foreground">
                Referral %
              </div>
            </div>
            <div className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 text-h3 text-foreground">
                {stats ? formatStat(stats.todaySignups) : "—"}
              </div>
              <div className="text-caption text-muted-foreground">Today</div>
            </div>
            <div className="relative rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center">
              <div className="mb-1 text-h3 text-foreground">—</div>
              <div className="text-caption text-muted-foreground">Warmth</div>
              <div className="absolute inset-0 flex items-center justify-center rounded-[var(--card-radius)] bg-background/80">
                <svg
                  width="16"
                  height="16"
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
              </div>
            </div>
          </div>

          <div className="mb-6">
            <SignupChart subdomain={subdomain} />
          </div>

          <div className="mb-6">
            <TopReferrers subscribers={subscribers} />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <QualificationPanel subdomain={subdomain} />
            <WarmthPanel />
          </div>

          <div className="rounded-[var(--card-radius)] border border-border bg-card">
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
            <div className="grid grid-cols-6 gap-4 border-b border-border px-5 py-3">
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
                        {sortDir === "asc" ? "↑" : "↓"}
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
                      className="grid grid-cols-6 gap-4 border-b border-border px-5 py-3 cursor-pointer transition-colors hover:bg-muted/30"
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
                          : "—"}
                      </span>
                      <span className="text-body-sm">
                        {sub.warmth_score ? (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              sub.warmth_score === "hot"
                                ? "bg-red-100 text-red-700"
                                : sub.warmth_score === "warm"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
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
              <div className="flex min-h-[80px] items-center justify-center">
                <span className="text-body-sm text-muted-foreground">
                  {searchQuery
                    ? "No subscribers match your search."
                    : "No subscribers yet. Share your link to get started."}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
