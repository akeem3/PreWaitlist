"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../../../components/ui/input";
import { createClient } from "../../../../lib/supabase/client";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";

interface ProfileData {
  displayName: string;
  tier: string;
  email: string;
  createdAt: string;
}

export default function ProfileClient() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Email change state
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProfileData | null) => {
        if (cancelled || !data) return;
        setProfile(data);
        setDisplayName(data.displayName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const hasChanges = profile && displayName !== profile.displayName;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (res.ok) {
        setSaved(true);
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

  async function handleEmailChange() {
    setEmailSaving(true);
    setEmailMsg(null);
    if (!newEmail || !newEmail.includes("@")) {
      setEmailMsg({ type: "err", text: "Enter a valid email address." });
      setEmailSaving(false);
      return;
    }
    if (newEmail === profile?.email) {
      setEmailMsg({ type: "err", text: "This is already your email address." });
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
          text: "Check your new email for a confirmation link. Your email will update after you confirm.",
        });
        setNewEmail("");
      }
    } catch {
      setEmailMsg({ type: "err", text: "Something went wrong." });
    } finally {
      setEmailSaving(false);
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
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Breadcrumb />
      <div className="mb-8">
        <h1 className="text-h3 font-semibold text-foreground">Profile</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Manage your account settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account details */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h4 font-medium text-foreground">Account</h2>
            {profile?.tier === "pro" && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                Pro
              </span>
            )}
          </div>

          <div className="mt-6 space-y-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="flex items-center gap-3">
                <span className="text-body text-foreground">
                  {profile?.email || "\u2014"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailChange(!showEmailChange);
                    setEmailMsg(null);
                    setNewEmail("");
                  }}
                  className="text-sm text-accent transition-colors hover:text-accent/80"
                >
                  {showEmailChange ? "Cancel" : "Change email"}
                </button>
              </div>
            </div>

            {/* Inline email change form */}
            {showEmailChange && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-3">
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
                      A confirmation link will be sent to the new email. Your
                      current email will remain active until you confirm.
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
                    {emailSaving
                      ? "Sending confirmation\u2026"
                      : "Send confirmation"}
                  </button>
                </div>
              </div>
            )}

            {/* Display name */}
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

            {/* Save */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving\u2026" : saved ? "Saved!" : "Save changes"}
              </button>
              {saved && (
                <span className="text-xs text-accent">Changes saved.</span>
              )}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 text-left transition-colors hover:bg-muted/30"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="shrink-0 text-muted-foreground"
          >
            <path
              d="M7.5 2.5H5C3.89543 2.5 3 3.39543 3 4.5V15.5C3 16.6046 3.89543 17.5 5 17.5H7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M13.75 10L17.5 10M17.5 10L15.5 8M17.5 10L15.5 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.25 10H13.75C14.4404 10 15 10.5596 15 11.25V14.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <p className="text-body-sm font-medium text-foreground">
              {signingOut ? "Signing out\u2026" : "Sign out"}
            </p>
            <p className="text-xs text-muted-foreground">
              Sign out of your account on this device
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
