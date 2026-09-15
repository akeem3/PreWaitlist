"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "../../../components/dashboard/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { STORAGE_KEY } from "../../../components/dashboard/waitlist-switcher";

interface WaitlistRow {
  id: string;
  subdomain: string;
  product_name: string | null;
  logo_url: string | null;
  is_archived: boolean;
}

interface DashboardShellProps {
  children: React.ReactNode;
  waitlists: WaitlistRow[];
  tier: string;
}

function getInitialActiveId(
  waitlists: WaitlistRow[],
  wid: string | null
): string {
  if (wid && waitlists.some((w) => w.id === wid)) return wid;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && waitlists.some((w) => w.id === stored)) return stored;
  } catch {}
  return waitlists[waitlists.length - 1].id;
}

export default function DashboardShell({
  children,
  waitlists,
  tier,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeWaitlistId, setActiveWaitlistId] = useState(() =>
    getInitialActiveId(waitlists, searchParams.get("wid"))
  );

  const effectiveId = activeWaitlistId;

  const activeWaitlist = waitlists.find((w) => w.id === effectiveId);

  const handleSelectWaitlist = useCallback(
    (waitlistId: string) => {
      setActiveWaitlistId(waitlistId);
      try {
        localStorage.setItem(STORAGE_KEY, waitlistId);
      } catch {}
      router.push(`/dashboard?wid=${waitlistId}`);
    },
    [router]
  );

  async function handleUnarchive() {
    if (!effectiveId) return;
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: effectiveId,
          is_archived: false,
          archived_at: null,
        }),
      });
      router.refresh();
    } catch {
      // silent
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        waitlists={waitlists}
        activeWaitlistId={effectiveId}
        onSelectWaitlist={handleSelectWaitlist}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tier={tier}
        isArchived={activeWaitlist?.is_archived ?? false}
        onUnarchive={handleUnarchive}
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

      <main className="min-h-screen lg:ml-67">{children}</main>
    </div>
  );
}
