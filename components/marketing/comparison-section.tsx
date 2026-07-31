"use client";

import { Card, CardContent } from "../ui/card";
import { FadeIn, StaggerGroup, StaggerItem } from "./animations";

function ExcludeMark() {
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
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="#DC2626"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IncludeMark() {
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
      <circle cx="8" cy="8" r="7.5" stroke="#0F7A5E" />
      <path
        d="M5 8L7 10L11 6"
        stroke="#0F7A5E"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const manualTools = [
  "Carrd for the page",
  "Mailchimp or ConvertKit for capture",
  "A spreadsheet to track it",
  "Three tools, none of them talking to each other.",
  "No referral tracking, no qualification — just a list of emails, and no way to know who\u2019s serious.",
];

const thisProduct = [
  "One page, live in 4 minutes",
  "One dashboard \u2014 signups, referrals, qualification, warmth.",
  "Eg. \u2018500 signups \u2014 32 already using a competitor, 8 enterprises\u2019",
  "Not just a count. A reason to call the right ones first.",
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="bg-card px-6 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-12">
          <FadeIn>
            <h2 className="text-h2">Why use a waitlisting tool</h2>
          </FadeIn>

          <StaggerGroup className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <StaggerItem className="h-full">
              <Card className="h-full border border-border">
                <CardContent className="flex flex-col gap-4">
                  <h3 className="text-h4">Building it manually</h3>
                  <ul className="flex flex-col gap-4">
                    {manualTools.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-body text-muted-foreground"
                      >
                        <ExcludeMark />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem className="h-full">
              <Card className="h-full border border-border">
                <CardContent className="flex flex-col gap-4">
                  <h3 className="text-h4">This product</h3>
                  <ul className="flex flex-col gap-4">
                    {thisProduct.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-body text-foreground"
                      >
                        <IncludeMark />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
