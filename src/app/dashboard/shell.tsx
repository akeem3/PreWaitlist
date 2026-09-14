"use client";

import { useState } from "react";
import { Sidebar } from "../../../components/dashboard/sidebar";
import { useRouter } from "next/navigation";

interface DashboardShellProps {
  children: React.ReactNode;
  waitlistName: string | null;
  logoUrl: string | null;
  tier: string;
  isArchived?: boolean;
  waitlistId?: string;
}

export default function DashboardShell({
  children,
  waitlistName,
  logoUrl,
  tier,
  isArchived,
  waitlistId,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  async function handleUnarchive() {
    if (!waitlistId) return;
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: waitlistId,
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
        waitlistName={waitlistName}
        logoUrl={logoUrl}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tier={tier}
        isArchived={isArchived}
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
