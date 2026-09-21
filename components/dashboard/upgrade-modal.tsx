"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePaddle } from "@/hooks/use-paddle";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerSource: string;
}

const HEADLINES: Record<string, string> = {
  broadcast: "Send broadcast emails to your waitlist",
  warmth: "See who's engaged and who's cold",
  subscriber_cap: "Remove the 500 subscriber limit",
  qual_question: "Add more qualification questions",
  billing: "Manage your subscription",
  csv_export: "Export your subscriber data",
  first_subscriber: "Unlock Pro features for your waitlist",
};

const FEATURES = [
  "Unlimited subscribers",
  "Broadcast emails",
  "Warmth tracking",
  "5 qualification questions",
  "CSV export",
  "Custom sender domain",
];

const COOLDOWN_DAYS = 1;

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
}: UpgradeModalProps) {
  const paddle = usePaddle();
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleUpgrade = useCallback(() => {
    if (!paddle) return;

    fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerSource }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          console.error("Checkout error:", data.error);
          return;
        }
        if (data.priceId) {
          paddle.Checkout.open({
            items: [{ priceId: data.priceId, quantity: 1 }],
            customData: data.customData,
            settings: { variant: "one-page" },
          });
          window.dispatchEvent(new CustomEvent("paddle-checkout-opened"));
        }
      })
      .catch((err) => {
        console.error("Failed to open checkout:", err);
      });

    onOpenChange(false);
  }, [paddle, triggerSource, onOpenChange]);

  const handleDismiss = useCallback(() => {
    suppress(triggerSource);
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
          {FEATURES.map((f) => (
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
