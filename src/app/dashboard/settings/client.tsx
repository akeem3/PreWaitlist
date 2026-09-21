"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import { Breadcrumb } from "../../../../components/dashboard/breadcrumb";

interface SettingsHubClientProps {
  waitlistCount: number;
}

const SECTIONS = [
  {
    title: "Waitlist Settings",
    description: "Configure your waitlist content, email, and advanced options",
    href: "/dashboard/settings/waitlists",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="2"
          y="3"
          width="16"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M2 7H18" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 11H10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M6 14H8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    accent: "bg-accent/10 text-accent",
  },
  {
    title: "Profile",
    description: "Manage your name, email, and display settings",
    href: "/dashboard/settings/profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3.5 17.5C3.5 14.5 6.2 12 10 12C13.8 12 16.5 14.5 16.5 17.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    accent: "bg-blue-50 text-blue-600",
  },
  {
    title: "Billing",
    description: "Manage your subscription, invoices, and payment method",
    href: "/dashboard/settings/billing",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="2"
          y="4"
          width="16"
          height="12"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M2 8H18" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5 12H9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    accent: "bg-purple-50 text-purple-600",
  },
  {
    title: "Security",
    description: "Update your password and email address",
    href: "/dashboard/settings/security",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2L4 5V9.5C4 13.6 6.6 17.4 10 18.5C13.4 17.4 16 13.6 16 9.5V5L10 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 10L9.5 12L13 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    accent: "bg-amber-50 text-amber-600",
  },
];

export default function SettingsHubClient({
  waitlistCount,
}: SettingsHubClientProps) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Breadcrumb />

      <div className="mb-8">
        <h1 className="text-h3 font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Manage your account and waitlist configuration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-accent/30 hover:shadow-sm"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.accent}`}
            >
              {section.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-body-lg font-medium text-foreground">
                {section.title}
              </h2>
              <p className="mt-0.5 text-body-sm text-muted-foreground">
                {section.description}
              </p>
              {section.title === "Waitlist Settings" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {waitlistCount === 0
                    ? "No waitlists yet"
                    : `${waitlistCount} waitlist${waitlistCount !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
            >
              <path
                d="M6 4L10 8L6 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 text-body-sm text-muted-foreground transition-colors hover:text-destructive"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 2H4C3.4 2 3 2.4 3 3V13C3 13.6 3.4 14 4 14H6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M11 8L14 8M14 8L12 6M14 8L12 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 8H10C10.6 8 11 7.6 11 7V3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
