"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../../../components/ui/input";
import { createClient } from "../../../../lib/supabase/client";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";

interface ProfileData {
  email: string;
}

export default function SecurityClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const router = useRouter();

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Delete Account state
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{
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
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteMsg(null);
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
      setDeleteMsg({
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
        <h1 className="text-h3 font-semibold text-foreground">Security</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Update your password and manage account security.
        </p>
      </div>

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
              {passwordSaving ? "Updating\u2026" : "Update password"}
            </button>
          </div>
        </div>

        {/* Danger Zone — Delete Account */}
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
          <h2 className="mb-1 text-h4 font-medium text-destructive">
            Delete account
          </h2>
          <p className="mb-6 text-body-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>

          {deleteMsg && (
            <p
              className={`mb-4 text-sm ${deleteMsg.type === "ok" ? "text-accent" : "text-destructive"}`}
            >
              {deleteMsg.text}
            </p>
          )}

          {deleteStep === 0 && (
            <button
              type="button"
              onClick={() => setDeleteStep(1)}
              className="rounded-lg border border-destructive/50 bg-card px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              Delete account
            </button>
          )}

          {deleteStep === 1 && (
            <div>
              <p className="mb-3 text-body-sm text-foreground">
                <strong>Warning:</strong> This will permanently delete your
                profile, all waitlists, subscribers, and updates.
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
                  {deleting ? "Deleting\u2026" : "Permanently delete"}
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
  );
}
