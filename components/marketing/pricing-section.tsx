"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { FadeIn, StaggerGroup, StaggerItem } from "./animations";

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

const tiers = [
  {
    name: "Base",
    priceLine: "Free \u2013 $0/month",
    features: [
      "1 waitlist, 500 signups",
      "3 templates",
      "Referral system + leaderboard",
      "2 qualification questions",
      "Qualification dashboard (basic aggregate)",
      "Warmth tracking (view)",
      "Founder updates feed",
      "Confirmation + \u2018moved up\u2019 email",
      "CSV export, all columns",
      "API access",
      "\u2014 \u2018Powered by\u2019 footer shown",
      "\u2014 No broadcast email (Pro feature)",
    ],
    variant: "secondary" as const,
  },
  {
    name: "Pro",
    priceLine: "$15/month",
    badge: "Popular",
    features: [
      "Everything in Base, plus",
      "Unlimited waitlists + signups",
      "5 qualification questions + full breakdown dashboard",
      "Broadcast email, warmth-segmented",
      "Sender name + domain authentication (one-time)",
      "Branding removed",
      "New templates as released",
      "Full dashboard analytics",
    ],
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
                  <CardContent className="flex flex-1 flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-body-sm font-medium text-muted-foreground">
                        {tier.name}
                      </span>
                      <span className="text-h2">{tier.priceLine}</span>
                    </div>

                    <ul className="flex flex-col gap-2">
                      {tier.features.map((feature) => {
                        const isExcluded = feature.startsWith("\u2014");
                        return (
                          <li
                            key={feature}
                            className={`flex items-start gap-2 text-sm ${
                              isExcluded
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {!isExcluded && <CheckIcon />}
                            {isExcluded ? feature : feature}
                          </li>
                        );
                      })}
                    </ul>

                    <div className="flex-1" />

                    <Link href="/signup" className="mt-auto">
                      <Button
                        variant={tier.variant}
                        size="lg"
                        className="w-full"
                      >
                        Build it free &mdash; live in 4 mins &rarr;
                      </Button>
                    </Link>
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
