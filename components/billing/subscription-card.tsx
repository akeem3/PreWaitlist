"use client";

interface SubscriptionCardProps {
  tier: string;
  waitlistCount: number;
}

export function SubscriptionCard({
  tier,
  waitlistCount,
}: SubscriptionCardProps) {
  const isPro = tier === "pro";

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
        {isPro && (
          <div className="text-right">
            <p className="text-body-sm text-muted-foreground">Next billing</p>
            <p className="text-body-sm font-medium text-foreground">
              October 1, 2026
            </p>
          </div>
        )}
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

      {isPro && (
        <div className="mt-4 rounded-lg bg-accent/5 px-4 py-3">
          <p className="text-body-sm text-accent">
            Your Pro subscription is active
          </p>
        </div>
      )}
    </div>
  );
}
