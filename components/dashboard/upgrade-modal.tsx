"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePaddle } from "@/hooks/use-paddle";
import { PRO_FEATURES } from "@/lib/pricing-features";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerSource: string;
  // Path Paddle returns to after successful payment (?upgraded=1 appended).
  // A path (not a full URL) because the origin can only be resolved in a
  // client-only context — reading window.location during render throws on
  // the server, since "use client" components still prerender. Defaults to
  // the billing page; onboarding passes its current step so payers resume
  // where they left off.
  successPath?: string;
}

const HEADLINES: Record<string, string> = {
  broadcast: "Send broadcast emails to your waitlist",
  warmth: "See who's engaged and who's cold",
  subscriber_cap: "Remove the 500 subscriber limit",
  qual_question: "Add more qualification questions",
  billing: "Manage your subscription",
  csv_export: "Export your subscriber data",
  email_customisation: "Customise your sender name, subject and body",
  first_subscriber: "Unlock Pro features for your waitlist",
  updates: "Share updates and email your waitlist",
  // Deep-link arrival keeps the billing page's own headline (existing string,
  // so the ?plan=pro leg renders exactly what it did before its trigger key
  // was split off from the settings-page "billing" opener).
  "pro-cta-billing": "Manage your subscription",
};

const COOLDOWN_DAYS = 1;

// Explicit-intent arrival deep links (?plan=pro from the Go Pro CTA) are
// exempt from the dismiss cooldown: the founder actively chose "Go Pro" in
// this session, so a prior dismissal must not auto-close the arrival modal —
// it flashed for ~3ms, then the already-stripped param lost the pay intent
// (reported as "the upgrade modal just flickers"). The cooldown still governs
// passive re-prompts (sidebar, gates, settings buttons), which use their own
// trigger keys.
const COOLDOWN_EXEMPT_TRIGGERS = new Set([
  "pro-cta-onboarding",
  "pro-cta-billing",
]);

function getCooldownKey(triggerSource: string): string {
  return `upgrade-dismissed-${triggerSource}`;
}

export function isSuppressed(triggerSource: string): boolean {
  try {
    const raw = localStorage.getItem(getCooldownKey(triggerSource));
    if (!raw) return false;
    const { dismissedAt } = JSON.parse(raw) as { dismissedAt: number };
    const elapsed = Date.now() - dismissedAt;
    return elapsed < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function suppress(triggerSource: string): void {
  try {
    localStorage.setItem(
      getCooldownKey(triggerSource),
      JSON.stringify({ dismissedAt: Date.now() })
    );
  } catch {
    // localStorage unavailable
  }
}

export function UpgradeModal({
  open,
  onOpenChange,
  triggerSource,
  successPath,
}: UpgradeModalProps) {
  const paddle = usePaddle();
  const router = useRouter();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = useCallback(() => {
    if (!paddle) return;
    setError(null);

    fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerSource }),
    })
      .then((res) => {
        // Logged-out visitor: route to signup with the pay intent preserved
        // instead of failing silently.
        if (res.status === 401) {
          onOpenChange(false);
          router.push("/signup?next=/dashboard/settings/billing&plan=pro");
          return null;
        }
        if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        if (data.priceId) {
          // window is safe here: this only executes on click, in the browser.
          const successUrl = successPath
            ? `${window.location.origin}${successPath}?upgraded=1`
            : `${window.location.origin}/dashboard/settings/billing?upgraded=1`;
          paddle.Checkout.open({
            items: [{ priceId: data.priceId, quantity: 1 }],
            customData: data.customData,
            settings: {
              variant: "one-page",
              successUrl,
            },
          });
          window.dispatchEvent(new CustomEvent("paddle-checkout-opened"));
          onOpenChange(false);
        }
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
      });
  }, [paddle, triggerSource, onOpenChange, router, successPath]);

  const handleDismiss = useCallback(() => {
    suppress(triggerSource);
    setError(null);
    onOpenChange(false);
  }, [triggerSource, onOpenChange]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        handleDismiss();
      }
    },
    [handleDismiss]
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleDismiss]);

  // AC8 cooldown: a dismissed trigger stays suppressed for COOLDOWN_DAYS.
  // Enforced here so every opener (sidebar, gates, billing) honors it —
  // except explicit-intent deep links, which must survive a prior dismissal
  // or they flicker shut and the arrival pay intent is lost.
  useEffect(() => {
    if (
      open &&
      !COOLDOWN_EXEMPT_TRIGGERS.has(triggerSource) &&
      isSuppressed(triggerSource)
    ) {
      onOpenChange(false);
    }
  }, [open, triggerSource, onOpenChange]);

  if (!open) return null;

  const headline = HEADLINES[triggerSource] ?? "Unlock all Pro features";

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
    >
      <div className="mx-4 w-full max-w-[480px] rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-float)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-foreground">
            Upgrade to Pro
          </h2>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-body text-muted-foreground">{headline}</p>

        <ul className="mb-6 space-y-2">
          {PRO_FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-body-sm text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="8"
                  fill="currentColor"
                  className="text-accent/10"
                />
                <path
                  d="M5 8L7 10L11 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-accent"
                />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">$15</span>
          <span className="text-body-sm text-muted-foreground">/month</span>
        </div>

        <p className="mb-4 text-caption text-muted-foreground">
          Cancel anytime
        </p>

        <button
          type="button"
          onClick={handleUpgrade}
          disabled={!paddle}
          className="w-full rounded-lg bg-accent px-4 py-3 text-body-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        >
          Upgrade to Pro
        </button>

        {error && (
          <p className="mt-2 text-center text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className="mt-2 w-full rounded-lg px-4 py-2 text-body-sm text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
