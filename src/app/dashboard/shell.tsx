"use client";

import {
  useState,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
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

interface DashboardContextValue {
  tier: string;
}

export const DashboardContext = createContext<DashboardContextValue | null>(
  null
);

export function useDashboardTier(): string | null {
  const ctx = useContext(DashboardContext);
  return ctx?.tier ?? null;
}

interface DashboardShellProps {
  children: React.ReactNode;
  waitlists: WaitlistRow[];
  tier: string;
}

function getServerDefaultId(waitlists: WaitlistRow[]): string {
  return waitlists[waitlists.length - 1].id;
}

function getStoredId(waitlists: WaitlistRow[]): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && waitlists.some((w) => w.id === stored)) return stored;
  } catch {}
  return null;
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
    getServerDefaultId(waitlists)
  );

  // Sync from URL param or localStorage after hydration (client-only).
  // Server renders with the last waitlist; client hydrates the same, then
  // corrects to the stored preference.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const wid = searchParams.get("wid");
    if (wid && waitlists.some((w) => w.id === wid)) {
      setActiveWaitlistId(wid);
      return;
    }
    const stored = getStoredId(waitlists);
    if (stored) {
      setActiveWaitlistId(stored);
    }
  }, [searchParams, waitlists]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

      <main className="min-h-screen lg:ml-67">
        <DashboardContext.Provider value={{ tier }}>
          {children}
        </DashboardContext.Provider>
      </main>
    </div>
  );
}
