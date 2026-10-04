"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { FadeIn, StaggerGroup, StaggerItem } from "./animations";
import {
  FREE_FEATURES,
  PRO_FEATURES,
  isExcludedFeature,
} from "@/lib/pricing-features";

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-0.5 shrink-0"
      aria-hidden="true"
    >
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
  );
}

const tiers = [
  {
    name: "Free",
    priceLine: "Free \u2013 $0/month",
    features: FREE_FEATURES,
    variant: "secondary" as const,
  },
  {
    name: "Pro",
    priceLine: "$15/month",
    badge: "Popular",
    features: PRO_FEATURES,
    variant: "primary" as const,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-12">
          <FadeIn>
            <h2 className="text-h2">Pricing</h2>
          </FadeIn>

          <StaggerGroup className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
            {tiers.map((tier) => (
              <StaggerItem key={tier.name} className="h-full">
                <Card
                  className={`relative flex h-full flex-col border ${
                    tier.badge ? "border-accent" : "border-border"
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
                      {tier.badge}
                    </span>
                  )}
                  <CardContent className="flex flex-1 flex-col gap-6 p-8">
                    <div className="flex flex-col gap-1 border-b border-border pb-5">
                      <span className="text-body-sm font-medium text-muted-foreground">
                        {tier.name}
                      </span>
                      <span className="text-3xl font-semibold tracking-tight text-foreground">
                        {tier.priceLine}
                      </span>
                    </div>

                    <ul className="flex flex-col gap-2">
                      {tier.features.map((feature) => {
                        const isExcluded = isExcludedFeature(feature);
                        return (
                          <li
                            key={feature}
                            className={`flex items-start gap-2.5 text-base ${
                              isExcluded
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {!isExcluded && <CheckIcon />}
                            {feature}
                          </li>
                        );
                      })}
                    </ul>

                    <div className="flex-1" />

                    {tier.name === "Pro" ? (
                      <Link
                        href="/signup?next=/dashboard/settings/billing&plan=pro"
                        className="mt-auto"
                      >
                        <Button
                          variant={tier.variant}
                          size="lg"
                          className="w-full"
                        >
                          Go Pro &mdash; live in 4 mins &rarr;
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/onboarding/1" className="mt-auto">
                        <Button
                          variant={tier.variant}
                          size="lg"
                          className="w-full"
                        >
                          Build it free &mdash; live in 4 mins &rarr;
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
