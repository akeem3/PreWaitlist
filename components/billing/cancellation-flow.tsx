"use client";

import { useState } from "react";

interface CancellationFlowProps {
  isPro: boolean;
}

export function CancellationFlow({ isPro }: CancellationFlowProps) {
  const [confirming, setConfirming] = useState(false);

  if (!isPro) return null;

  async function handleConfirmCancel() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail — user can retry
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-2 text-h4 font-medium text-foreground">
        Cancel Subscription
      </h3>
      <p className="mb-4 text-body-sm text-muted-foreground">
        Cancel your Pro subscription. Your waitlist will remain active but
        features will revert to the Free tier.
      </p>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5"
        >
          Cancel subscription
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-body-sm text-muted-foreground">
            Are you sure? You will lose access to broadcast emails, domain
            authentication, and unlimited signups at the end of your billing
            period.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90"
            >
              Confirm cancellation
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30"
            >
              Keep subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
