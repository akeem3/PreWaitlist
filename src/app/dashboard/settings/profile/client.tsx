"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsTabs } from "../../../../../components/dashboard/settings/tabs";
import { createClient } from "../../../../lib/supabase/client";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
];

export default function ProfileClient() {
  const [activeTab, setActiveTab] = useState("profile");
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
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-h3 font-semibold text-foreground">Profile</h1>
            <p className="mt-1 text-body text-muted-foreground">
              Manage your account settings.
            </p>
          </div>
        </div>
      </div>

      <SettingsTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === "profile" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">
              Profile
            </h2>
            <p className="text-body-sm text-muted-foreground">
              Profile management coming soon.
            </p>
          </div>
        )}

        {activeTab === "security" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-h4 font-medium text-foreground">
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 text-body-sm font-medium text-foreground">
                  Reset password
                </h3>
                <p className="mb-3 text-body-sm text-muted-foreground">
                  Send a password reset email to your registered address.
                </p>
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-border bg-card px-4 py-2 text-body-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  Reset password
                </button>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="mb-1 text-body-sm font-medium text-foreground">
                  Sign out
                </h3>
                <p className="mb-3 text-body-sm text-muted-foreground">
                  Sign out of your account on this device.
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-body-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
