"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { SettingsTabs } from "../../../../../components/dashboard/settings/tabs";
import { createClient } from "../../../../lib/supabase/client";

interface ProfileData {
  displayName: string;
  avatarUrl: string;
  bio: string;
  tier: string;
  email: string;
  createdAt: string;
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
];

export default function ProfileClient() {
  const [activeTab, setActiveTab] = useState("profile");
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProfileData | null) => {
        if (cancelled || !data) return;
        setProfile(data);
        setDisplayName(data.displayName);
        setAvatarUrl(data.avatarUrl);
        setBio(data.bio);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasChanges =
    profile &&
    (displayName !== profile.displayName ||
      avatarUrl !== profile.avatarUrl ||
      bio !== profile.bio);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          avatar_url: avatarUrl,
          bio,
        }),
      });
      if (res.ok) {
        setSaved(true);
        // Re-fetch profile to sync
        fetch("/api/profile")
          .then((r) => (r.ok ? r.json() : null))
          .then((data: ProfileData | null) => {
            if (data) setProfile(data);
          })
          .catch(() => {});
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

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
            <div className="flex items-center justify-between">
              <h2 className="text-h4 font-medium text-foreground">
                Profile details
              </h2>
              {profile?.tier === "pro" && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Pro
                </span>
              )}
            </div>

            <div className="mt-6 space-y-5">
              {/* Email (read-only) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  value={profile?.email || ""}
                  disabled
                  className="opacity-60"
                />
              </div>

              {/* Display Name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Display name
                </label>
                <Input
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Shown in dashboard and emails. Leave blank to use your email.
                </p>
              </div>

              {/* Avatar URL */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Avatar URL
                </label>
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a URL to your profile picture.
                </p>
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  Bio
                </label>
                <Textarea
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Save */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
                </button>
                {saved && (
                  <span className="text-xs text-accent">Changes saved.</span>
                )}
              </div>
            </div>
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
