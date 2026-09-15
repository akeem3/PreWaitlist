"use client";

import { useState } from "react";

interface ThankYouNameInputProps {
  subscriberId: string;
  referralCode: string;
}

export function ThankYouNameInput({
  subscriberId,
  referralCode,
}: ThankYouNameInputProps) {
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = displayName.trim();
    if (!trimmed || saved) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/subscribers/${subscriberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: trimmed,
          referral_code: referralCode,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      // Silent — input stays editable for retry
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <p className="text-body-sm text-muted-foreground mt-4 text-center">
        Thanks, {displayName.trim()}!
      </p>
    );
  }

  return (
    <div className="mt-4 w-full max-w-xs">
      <input
        type="text"
        placeholder="First name (optional)"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
        disabled={saving}
        autoComplete="given-name"
        aria-label="First name"
        className="h-10 w-full rounded-[var(--input-radius)] border border-border bg-card px-[var(--input-padding-x)] py-[var(--input-padding-y)] text-body-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
