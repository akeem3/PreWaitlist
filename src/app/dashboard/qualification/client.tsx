"use client";

import { useState } from "react";
import { Sidebar } from "../../../../components/dashboard/sidebar";
import QualificationPanel from "../../../../components/dashboard/qualification-panel";
import { createClient } from "../../../../src/lib/supabase/client";

interface QualificationClientProps {
  subdomain: string;
  waitlistName: string | null;
  logoUrl: string | null;
  tier: string;
}

export default function QualificationClient({
  subdomain,
  waitlistName,
  logoUrl,
  tier,
}: QualificationClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/signin";
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

      <main className="min-h-screen lg:ml-67">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="mb-6 text-h2 text-foreground">Qualification</h1>
          <QualificationPanel subdomain={subdomain} />
        </div>
      </main>
    </div>
  );
}
