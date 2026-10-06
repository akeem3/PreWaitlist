"use client";

import { useState } from "react";
import { capture } from "../../src/lib/analytics";

interface CancellationFlowProps {
  isPro: boolean;
  onOpenPortal?: () => void;
  portalPending?: boolean;
  portalError?: string | null;
}

export function CancellationFlow({
  isPro,
  onOpenPortal,
  portalPending,
  portalError,
}: CancellationFlowProps) {
  const [confirming, setConfirming] = useState(false);

  if (!isPro) return null;

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
          onClick={() => {
            // Story 20.1 AC5 — Survey 2's event trigger (first cancel click,
            // not the confirmation step). surveyTrigger (D7) lets the wrapper
            // hold this back while the upgrade modal owns the UI.
            capture("cancel_intent", undefined, { surveyTrigger: true });
            setConfirming(true);
          }}
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
              onClick={onOpenPortal}
              disabled={portalPending}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
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
          {portalError && (
            <p role="alert" className="text-body-sm text-destructive">
              {portalError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
