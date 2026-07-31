"use client";

import { Card, CardContent } from "../ui/card";
import { StaggerGroup, StaggerItem } from "./animations";

function QualificationIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="10" cy="6" r="3.5" stroke="#0F7A5E" strokeWidth="1.5" />
      <path
        d="M3 18C3 14.134 6.13401 11 10 11C13.866 11 17 14.134 17 18"
        stroke="#0F7A5E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WarmthIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M10 2C10 2 4 8.5 4 12.5C4 15.5376 6.46243 18 9.5 18H10.5C13.5376 18 16 15.5376 16 12.5C16 8.5 10 2 10 2Z"
        stroke="#0F7A5E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18C10 18 8 15.5 8 13.5C8 12.1193 9.11929 11 10.5 11C11.8807 11 13 12.1193 13 13.5C13 15.5 10 18 10 18Z"
        fill="#0F7A5E"
        opacity="0.3"
      />
    </svg>
  );
}

function ReferralIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M8.5 11.5C9.88071 12.8807 12.1193 12.8807 13.5 11.5"
        stroke="#0F7A5E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="5.5" cy="11.5" r="2" stroke="#0F7A5E" strokeWidth="1.5" />
      <circle cx="16.5" cy="11.5" r="2" stroke="#0F7A5E" strokeWidth="1.5" />
    </svg>
  );
}

function CommunicationIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="4"
        width="16"
        height="12"
        rx="2"
        stroke="#0F7A5E"
        strokeWidth="1.5"
      />
      <path
        d="M2 6L10 12L18 6"
        stroke="#0F7A5E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const features = [
  {
    icon: QualificationIcon,
    title: "Qualification",
    description: "Know who\u2019s serious",
  },
  {
    icon: WarmthIcon,
    title: "Warmth tracking",
    description: "Know who\u2019s still paying attention",
  },
  {
    icon: ReferralIcon,
    title: "Referral quality",
    description: "Know who\u2019s driving real demand",
  },
  {
    icon: CommunicationIcon,
    title: "Communication",
    description:
      "Broadcast to hot, warm, or cold segments only. Practical sender domain setup walked through for you.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <StaggerGroup className="grid grid-cols-1 grid-rows-[1fr_1fr] gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={feature.title} className="h-full">
                <Card className="h-full border border-border">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icon />
                      <h3 className="text-h4">{feature.title}</h3>
                    </div>
                    <p className="text-body text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
