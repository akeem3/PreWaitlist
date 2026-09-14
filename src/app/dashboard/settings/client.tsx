"use client";

import { useState } from "react";

interface SettingsClientProps {
  waitlistId: string;
  senderName: string | null;
  coldThreshold: number;
  sendingDomain: string | null;
  tier: string;
}

export default function SettingsClient({
  waitlistId,
  senderName,
  coldThreshold,
  tier,
}: SettingsClientProps) {
  const [senderNameValue, setSenderNameValue] = useState(senderName ?? "");
  const [senderNameSaved, setSenderNameSaved] = useState(false);
  const [senderNameSaving, setSenderNameSaving] = useState(false);
  const [senderNameError, setSenderNameError] = useState<string | null>(null);

  const [thresholdValue, setThresholdValue] = useState(coldThreshold);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [thresholdSaving, setThresholdSaving] = useState(false);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  async function handleSaveSenderName() {
    setSenderNameSaving(true);
    setSenderNameError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: waitlistId,
          sender_name: senderNameValue || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSenderNameError(data.error || "Failed to save");
        return;
      }
      setSenderNameSaved(true);
      setTimeout(() => setSenderNameSaved(false), 2000);
    } catch {
      setSenderNameError("Network error \u2014 please try again");
    } finally {
      setSenderNameSaving(false);
    }
  }

  async function handleSaveThreshold() {
    setThresholdSaving(true);
    setThresholdError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: waitlistId,
          cold_threshold: thresholdValue,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setThresholdError(data.error || "Failed to save");
        return;
      }
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 2000);
    } catch {
      setThresholdError("Network error \u2014 please try again");
    } finally {
      setThresholdSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-8 text-h2 text-foreground">Settings</h1>

      <div className="flex flex-col gap-6">
        {/* Email Section */}
        <div className="rounded-[var(--card-radius)] border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Email</h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Sender name
              </label>
              <input
                type="text"
                value={senderNameValue}
                onChange={(e) => setSenderNameValue(e.target.value)}
                placeholder="PreWaitlist"
                className="h-10 rounded-[var(--input-radius)] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
              <p className="text-xs text-muted-foreground">
                The name recipients see in their inbox.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSenderName}
                disabled={senderNameSaving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {senderNameSaving
                  ? "Saving..."
                  : senderNameSaved
                    ? "Saved!"
                    : "Save changes"}
              </button>
            </div>
            {senderNameError && (
              <p className="text-xs text-destructive">{senderNameError}</p>
            )}
          </div>
        </div>

        {/* Warmth Threshold Section */}
        <div className="rounded-[var(--card-radius)] border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Warmth Alert
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Cold threshold (%)
              </label>
              <input
                type="number"
                min={20}
                max={80}
                value={thresholdValue}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v))
                    setThresholdValue(Math.min(80, Math.max(20, v)));
                }}
                className="h-10 w-32 rounded-[var(--input-radius)] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              />
              <p className="text-xs text-muted-foreground">
                Show a warning when cold subscribers exceed this percentage.
                Range: 20–80%.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveThreshold}
                disabled={thresholdSaving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {thresholdSaving
                  ? "Saving..."
                  : thresholdSaved
                    ? "Saved!"
                    : "Save changes"}
              </button>
            </div>
            {thresholdError && (
              <p className="text-xs text-destructive">{thresholdError}</p>
            )}
          </div>
        </div>

        {/* Billing Section */}
        <div className="rounded-[var(--card-radius)] border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Billing
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current plan</span>
              <span
                className={`font-medium ${tier === "pro" ? "text-accent" : "text-foreground"}`}
              >
                {tier === "pro" ? "Pro" : "Free"}
              </span>
            </div>
            {tier === "free" ? (
              <button
                type="button"
                disabled
                title="Paddle billing coming soon"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground opacity-60 cursor-not-allowed"
              >
                Upgrade to Pro
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Paddle billing coming soon"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground opacity-60 cursor-not-allowed"
              >
                Manage billing
              </button>
            )}
          </div>
        </div>

        {/* Sender Domain Section */}
        <div className="rounded-[var(--card-radius)] border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Sender Domain
          </h3>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Verify your own domain to send emails from your@domain.com instead
              of prewaitlist.com.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Domain
              </label>
              <input
                type="text"
                placeholder="mail.yourdomain.com"
                disabled
                className="h-10 rounded-[var(--input-radius)] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Coming soon — domain authentication will be available in a future
              update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
