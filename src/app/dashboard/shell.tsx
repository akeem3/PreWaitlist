"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "../../../components/dashboard/sidebar";
import { createClient } from "../../lib/supabase/client";

interface DashboardShellProps {
  children: React.ReactNode;
  waitlistName: string | null;
  logoUrl: string | null;
  tier: string;
}

export default function DashboardShell({
  children,
  waitlistName,
  logoUrl,
  tier,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  }

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

      <main className="min-h-screen lg:ml-67">{children}</main>
    </div>
  );
}
