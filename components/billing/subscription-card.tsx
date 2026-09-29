"use client";

interface ScheduledChange {
  action: string;
  effective_at: string;
}

interface SubscriptionCardProps {
  tier: string;
  waitlistCount: number;
  scheduledChange?: ScheduledChange | null;
  subscriptionStatus?: string | null;
  nextBilledAt?: string | null;
  onManageBilling?: () => void;
  managePending?: boolean;
  portalError?: string | null;
}

function formatBillingDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SubscriptionCard({
  tier,
  waitlistCount,
  scheduledChange,
  subscriptionStatus,
  nextBilledAt,
  onManageBilling,
  managePending,
  portalError,
}: SubscriptionCardProps) {
  const isPro = tier === "pro";
  const isPastDue = isPro && subscriptionStatus === "past_due";
  const cancelScheduled =
    isPro &&
    scheduledChange?.action === "cancel" &&
    !!scheduledChange.effective_at;
  const cancelDate = cancelScheduled
    ? formatBillingDate(scheduledChange!.effective_at)
    : "";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-h4 font-medium text-foreground">Current Plan</h3>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPro
                  ? "bg-accent/10 text-accent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <p className="text-body-sm text-muted-foreground">Plan details</p>
        <span className="text-body-sm text-foreground">
          {isPro
            ? "Unlimited waitlists & signups"
            : "1 waitlist, 500 signups max"}
        </span>
      </div>

      {!isPro && (
        <div className="mt-4 rounded-lg bg-muted/30 px-4 py-3">
          <p className="text-body-sm text-muted-foreground">
            {waitlistCount} of 1 waitlist used
          </p>
        </div>
      )}

      {isPastDue && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-destructive/5 px-4 py-3">
          <p className="text-body-sm text-destructive">
            Payment failed. Update your payment to keep Pro active.
          </p>
          {onManageBilling && (
            <button
              type="button"
              onClick={onManageBilling}
              disabled={managePending}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              Update payment
            </button>
          )}
        </div>
      )}

      {!isPastDue && cancelScheduled && (
        <div className="mt-4 rounded-lg bg-muted/30 px-4 py-3">
          <p className="text-body-sm text-foreground">
            Pro until {cancelDate} — your subscription will not renew.
          </p>
        </div>
      )}

      {isPro && !isPastDue && !cancelScheduled && (
        <div className="mt-4 rounded-lg bg-accent/5 px-4 py-3">
          <p className="text-body-sm text-accent">
            Your Pro subscription is active
          </p>
          {nextBilledAt && (
            <p className="mt-1 text-body-sm text-muted-foreground">
              Your Pro renews on {formatBillingDate(nextBilledAt)}.
            </p>
          )}
        </div>
      )}

      {portalError && (
        <p role="alert" className="mt-4 text-body-sm text-destructive">
          {portalError}
        </p>
      )}

      {isPro && onManageBilling && !isPastDue && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onManageBilling}
            disabled={managePending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/30 disabled:opacity-50"
          >
            Manage Billing
          </button>
        </div>
      )}
    </div>
  );
}
