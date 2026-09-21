"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { SettingsTabs } from "../../../../../components/dashboard/settings/tabs";
import { createClient } from "../../../../lib/supabase/client";
import { SubscriptionCard } from "../../../../../components/billing/subscription-card";
import { PlanComparison } from "../../../../../components/billing/plan-comparison";
import { InvoiceHistory } from "../../../../../components/billing/invoice-history";
import { BillingDetails } from "../../../../../components/billing/billing-details";
import { CancellationFlow } from "../../../../../components/billing/cancellation-flow";
import { DomainAuthSection } from "../../../../../components/billing/domain-auth-section";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";
import { useUpgradeModal } from "../../shell";

interface ProfileData {
  displayName: string;
  avatarUrl: string;
  bio: string;
  tier: string;
  email: string;
  createdAt: string;
  businessAddress: string;
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
  { id: "security", label: "Security" },
];

export default function ProfileClient() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const router = useRouter();
  const triggerUpgrade = useUpgradeModal();

  // Security tab state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Danger Zone state
  const [exporting, setExporting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

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
      })
      .catch(() => {});
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

  const handleAddressSave = useCallback(async (address: string) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_address: address }),
    });
    if (res.ok) {
      setProfile((prev) =>
        prev ? { ...prev, businessAddress: address } : prev
      );
    }
  }, []);

  const handleManageBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail — user can retry
    }
  }, []);

  async function handlePasswordChange() {
    setPasswordSaving(true);
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "err", text: "New passwords do not match." });
      setPasswordSaving(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "err",
        text: "Password must be at least 6 characters.",
      });
      setPasswordSaving(false);
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setPasswordMsg({
          type: "err",
          text: error.message.includes("recent")
            ? "Please sign in again to change your password."
            : error.message,
        });
      } else {
        setPasswordMsg({ type: "ok", text: "Password updated." });
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMsg({ type: "err", text: "Something went wrong." });
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleEmailChange() {
    setEmailSaving(true);
    setEmailMsg(null);
    if (!newEmail || !newEmail.includes("@")) {
      setEmailMsg({ type: "err", text: "Enter a valid email address." });
      setEmailSaving(false);
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        setEmailMsg({
          type: "err",
          text: error.message.includes("recent")
            ? "Please sign in again to change your email."
            : error.message,
        });
      } else {
        setEmailMsg({
          type: "ok",
          text: "Check your new email for a confirmation link.",
        });
        setNewEmail("");
      }
    } catch {
      setEmailMsg({ type: "err", text: "Something went wrong." });
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/profile/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prewaitlist-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setPasswordMsg({ type: "err", text: "Export failed. Please try again." });
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Delete failed");
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      setPasswordMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Delete failed.",
      });
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Breadcrumb />
      <div className="mb-8">
        <h1 className="text-h3 font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Manage your account settings.
        </p>
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

        {activeTab === "billing" && (
          <div className="space-y-6">
            <SubscriptionCard
              tier={profile?.tier || "free"}
              waitlistCount={1}
              onManageBilling={
                profile?.tier === "pro" ? handleManageBilling : undefined
              }
            />
            <PlanComparison
              currentTier={profile?.tier || "free"}
              onUpgradeClick={() => triggerUpgrade("billing")}
            />
            <BillingDetails
              businessAddress={profile?.businessAddress || ""}
              onAddressSave={handleAddressSave}
            />
            <InvoiceHistory isPro={profile?.tier === "pro"} />
            {profile?.tier === "pro" && <DomainAuthSection />}
            <CancellationFlow isPro={profile?.tier === "pro"} />
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-h4 font-medium text-foreground">
                Change password
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    New password
                  </label>
                  <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Confirm password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passwordMsg && (
                  <p
                    className={`text-sm ${passwordMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
                  >
                    {passwordMsg.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !newPassword || !confirmPassword}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordSaving ? "Updating…" : "Update password"}
                </button>
              </div>
            </div>

            {/* Change Email */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-h4 font-medium text-foreground">
                Change email
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Current email
                  </label>
                  <Input
                    value={profile?.email || ""}
                    disabled
                    className="opacity-60"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    New email
                  </label>
                  <Input
                    type="email"
                    placeholder="new@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A confirmation link will be sent to the new email.
                  </p>
                </div>
                {emailMsg && (
                  <p
                    className={`text-sm ${emailMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
                  >
                    {emailMsg.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleEmailChange}
                  disabled={emailSaving || !newEmail}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailSaving ? "Updating…" : "Update email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="mt-8 rounded-xl border border-destructive/50 bg-destructive/5 p-6">
        <h2 className="mb-1 text-h4 font-medium text-destructive">
          Danger Zone
        </h2>
        <p className="mb-6 text-body-sm text-muted-foreground">
          Irreversible actions. Please proceed with caution.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-body-sm font-medium text-foreground">
                Export my data
              </h3>
              <p className="text-xs text-muted-foreground">
                Download a JSON file with your profile, waitlists, and
                subscribers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              {exporting ? "Exporting…" : "Export data"}
            </button>
          </div>

          {/* Delete Account */}
          <div className="border-t border-destructive/20 pt-4">
            {deleteStep === 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body-sm font-medium text-foreground">
                    Delete account
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteStep(1)}
                  className="rounded-lg border border-destructive/50 bg-card px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  Delete account
                </button>
              </div>
            )}

            {deleteStep === 1 && (
              <div>
                <p className="mb-3 text-body-sm text-foreground">
                  <strong>Warning:</strong> This will permanently delete your
                  profile, all waitlists, subscribers, and updates. This action
                  cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep(2);
                      setDeleteEmail("");
                    }}
                    className="rounded-lg border border-destructive/50 bg-card px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(0)}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div>
                <p className="mb-3 text-body-sm text-foreground">
                  Type your email <strong>{profile?.email}</strong> to confirm
                  deletion:
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    className="max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteEmail !== profile?.email}
                    className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting…" : "Permanently delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(0)}
                    disabled={deleting}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
