"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ShareCopyLink from "../../../components/share/share-copy-link";

interface DashboardClientProps {
  liveUrl: string;
  waitlistName: string | null;
  logoUrl: string | null;
}

const NAV_TABS = [
  { label: "Overview", href: "/dashboard", active: true },
  { label: "Subscribers", href: "/dashboard", active: false },
  { label: "Broadcasts", href: "/dashboard", active: false },
  { label: "Settings", href: "/dashboard", active: false },
];

const CHECKLIST_ITEMS = [
  {
    id: "share",
    label: "Share the link",
    autoCheck: true,
  },
  {
    id: "community",
    label: "Post in one community where your audience already is",
    autoCheck: false,
  },
  {
    id: "personal",
    label: "Tell 5 people personally",
    autoCheck: false,
  },
];

const TABLE_COLUMNS = [
  "Name",
  "Email",
  "Position",
  "Warmth",
  "Referrals",
  "Date",
];

export default function DashboardClient({
  liveUrl,
  waitlistName,
  logoUrl,
}: DashboardClientProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  function handleShareOrCopy() {
    setCheckedItems((prev) => new Set(prev).add("share"));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={waitlistName || "Logo"}
                width={32}
                height={32}
                className="rounded"
                priority
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="text-accent"
                >
                  <path
                    d="M2 4L8 2L14 4V12L8 14L2 12V4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <span className="text-body-sm font-medium text-foreground">
              {waitlistName || "My Waitlist"}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-muted-foreground"
            >
              <path
                d="M3 5L6 8L9 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-muted-foreground"
            >
              <path
                d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z"
                fill="currentColor"
              />
              <path
                d="M3 13C3 10.7909 5.23858 9 8 9C10.7614 9 13 10.7909 13 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Nav tabs — separate row */}
        <div className="border-t border-border">
          <nav className="mx-auto flex max-w-6xl gap-1 px-6 py-1">
            {NAV_TABS.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={`px-4 py-2 text-body-sm transition-colors ${
                  tab.active
                    ? "font-bold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Live URL + copy/share inline */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-body-sm text-foreground">{liveUrl}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`https://${liveUrl}`);
              handleShareOrCopy();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            copy
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.share({ url: `https://${liveUrl}` }).catch(() => {});
              handleShareOrCopy();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path
                d="M13 6C13 6 11 1 8 1C5 1 3 6 3 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M2 10L8 14L14 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            share
          </button>
        </div>

        {/* Stat cards — 5 in a row */}
        <div className="mb-6 grid grid-cols-5 gap-3">
          {[
            { label: "total signups", value: "— —" },
            { label: "referral", value: "—%" },
            { label: "hot", value: "—" },
            { label: "warm", value: "—" },
            { label: "cold", value: "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--card-radius)] border border-border bg-card px-4 py-3 text-center"
            >
              <div className="mb-1 text-h3 text-foreground">{stat.value}</div>
              <div className="text-caption text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Share prompt */}
        <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
          <p className="mb-4 text-body-sm text-foreground">
            Your waitlist is live. Share it to get your first signups.
          </p>
          <ShareCopyLink
            url={`https://${liveUrl}`}
            onShare={handleShareOrCopy}
            onCopy={handleShareOrCopy}
          />
        </div>

        {/* Getting started checklist */}
        <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
          <p className="mb-4 text-caption text-muted-foreground">
            getting started — item 1 checks off automatically once you share
            above
          </p>
          <ul className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = item.autoCheck
                ? checkedItems.has(item.id)
                : false;
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

        {/* Chart placeholder */}
        <div className="mb-6 flex min-h-[120px] items-center justify-center rounded-[var(--card-radius)] border border-dashed border-border bg-card">
          <span className="text-body-sm text-muted-foreground">
            signups over time — your chart will appear here
          </span>
        </div>

        {/* Qualification breakdown + Warmth distribution */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
            <h3 className="mb-3 text-body-sm font-medium text-foreground">
              qualification breakdown
            </h3>
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
            <h3 className="mb-3 text-body-sm font-medium text-foreground">
              warmth distribution
            </h3>
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        </div>

        {/* Subscriber table */}
        <div className="rounded-[var(--card-radius)] border border-border bg-card">
          <div className="grid grid-cols-6 gap-4 border-b border-border px-5 py-3">
            {TABLE_COLUMNS.map((col) => (
              <span
                key={col}
                className="text-caption font-medium text-muted-foreground"
              >
                {col}
              </span>
            ))}
          </div>
          <div className="flex min-h-[80px] items-center justify-center">
            <span className="text-body-sm text-muted-foreground">
              No subscribers yet. Share your link to get started.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
