"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { FadeIn } from "./animations";

export function ConfidenceSection() {
  return (
    <section
      id="confidence"
      className="border-y border-border px-6 py-16 md:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p
              className="max-w-xl text-xl text-accent"
              style={{ fontWeight: 600 }}
            >
              No competitor bundles qualification, warmth, referral quality, and
              segmented broadcast below $29/month. This product gives all four,{" "}
              <strong>free</strong>, up to <strong>500</strong> signups.
            </p>
            <Link href="/onboarding/1" className="shrink-0">
              <Button size="md">Build it free &rarr;</Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
