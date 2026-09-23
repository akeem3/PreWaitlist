"use client";

import { Button } from "../ui/button";
import {
  FREE_FEATURES,
  PRO_FEATURES,
  isExcludedFeature,
} from "@/lib/pricing-features";

interface PlanComparisonProps {
  currentTier: string;
  onUpgradeClick?: () => void;
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: FREE_FEATURES,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/month",
    features: PRO_FEATURES,
  },
];

export function PlanComparison({
  currentTier,
  onUpgradeClick,
}: PlanComparisonProps) {
  const isPro = currentTier === "pro";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-h4 font-medium text-foreground">
        {isPro ? "Your Pro Plan" : "Upgrade to Pro"}
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = plan.name.toLowerCase() === currentTier;

          return (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-4 ${
                isCurrent ? "border-accent bg-accent/5" : "border-border"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  Current
                </span>
              )}

              <div className="mb-3">
                <p className="text-body-sm font-medium text-muted-foreground">
                  {plan.name}
                </p>
                <p className="text-h3 font-semibold text-foreground">
                  {plan.price}
                  <span className="text-body-sm text-muted-foreground">
                    {plan.period}
                  </span>
                </p>
              </div>

              <ul className="mb-4 space-y-2">
                {plan.features.map((feature) => {
                  const excluded = isExcludedFeature(feature);
                  return (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 text-sm ${
                        excluded ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {!excluded && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          className="mt-0.5 shrink-0"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 7L5.5 9.5L11 4"
                            stroke="#0F7A5E"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {feature}
                    </li>
                  );
                })}
              </ul>

              {!isCurrent && (
                <Button
                  variant={plan.name === "Pro" ? "primary" : "secondary"}
                  size="sm"
                  className="w-full"
                  disabled={plan.name !== "Pro"}
                  onClick={plan.name === "Pro" ? onUpgradeClick : undefined}
                >
                  {plan.name === "Pro"
                    ? isPro
                      ? "Your current plan"
                      : "Upgrade to Pro"
                    : "Downgrade"}
                </Button>
              )}

              {isCurrent && isPro && (
                <div className="w-full rounded-lg border border-accent/30 bg-accent/5 py-2 text-center text-sm font-medium text-accent">
                  Your current plan
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
