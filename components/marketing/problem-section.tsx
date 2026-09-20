"use client";

import { Card, CardContent } from "../ui/card";
import { FadeIn, StaggerGroup, StaggerItem } from "./animations";

function PersonIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="10" r="6" stroke="#0F7A5E" strokeWidth="2" />
      <path
        d="M6 28C6 22.477 10.477 18 16 18C21.523 18 26 22.477 26 28"
        stroke="#0F7A5E"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="6" width="4" height="4" rx="1" fill="#0F7A5E" />
      <rect x="12" y="6" width="16" height="4" rx="1" fill="#0F7A5E" />
      <rect x="4" y="14" width="4" height="4" rx="1" fill="#0F7A5E" />
      <rect x="12" y="14" width="16" height="4" rx="1" fill="#0F7A5E" />
      <rect x="4" y="22" width="4" height="4" rx="1" fill="#0F7A5E" />
      <rect x="12" y="22" width="16" height="4" rx="1" fill="#0F7A5E" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="4"
        width="20"
        height="24"
        rx="3"
        stroke="#0F7A5E"
        strokeWidth="2"
      />
      <path
        d="M12 4V8C12 9.10457 12.8954 10 14 10H18C19.1046 10 20 9.10457 20 8V4"
        stroke="#0F7A5E"
        strokeWidth="2"
      />
      <path
        d="M12 18L14.5 20.5L20 14"
        stroke="#0F7A5E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const problems = [
  {
    icon: PersonIcon,
    title: "They count emails, not interests",
  },
  {
    icon: ListIcon,
    title: "They can\u2019t see a list going cold until launch day",
  },
  {
    icon: ClipboardIcon,
    title: "They give you a count, not a reason to trust it",
  },
];

export function ProblemSection() {
  return (
    <section
      id="problem"
      className="border-b border-border px-6 py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-16">
          <FadeIn className="flex flex-col items-center gap-6 text-center">
            <h2 className="text-h2">The problem with most waitlists</h2>
            <p className="max-w-2xl text-body-lg text-muted-foreground">
              Signups converted within a month average 50%. Wait past 90 days,
              and it drops to single digits.
            </p>
          </FadeIn>

          <StaggerGroup className="grid w-full grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 sm:justify-items-stretch md:grid-cols-3 md:gap-10">
            {problems.map((problem) => {
              const Icon = problem.icon;
              return (
                <StaggerItem
                  key={problem.title}
                  className="h-full w-full max-w-sm sm:max-w-none"
                >
                  <Card className="h-full min-h-[160px] border border-border rounded-[10px]">
                    <CardContent className="flex h-full flex-col items-start gap-4">
                      <Icon />
                      <p className="text-body-lg text-muted-foreground">
                        {problem.title}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
