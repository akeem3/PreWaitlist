"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "../ui/button";
import { FadeIn } from "./animations";

function HeroContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const isPoweredBy = Boolean(ref);

  if (isPoweredBy) {
    return (
      <section className="border-b border-border px-6 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-10 text-center">
            <FadeIn>
              <span className="inline-flex items-center rounded-full bg-accent/10 px-4 py-1.5 text-body-sm font-medium text-accent">
                You just saw this in action
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="max-w-xl text-display md:max-w-4xl">
                That waitlist runs on{" "}
                <span className="text-accent">PreWaitlist</span>. Yours can be
                live in 4 minutes.
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="max-w-2xl text-body-lg text-muted-foreground">
                Qualification questions • Warmth tracking • Referral quality
                score • Email broadcast • Live in 4mins • CSV export always
                free.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Link href="/onboarding/1">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Build it free — live in 4 mins →
                </Button>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border px-6 py-20 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-10 text-center">
          <FadeIn>
            <h1 className="max-w-xl text-display md:max-w-4xl">
              Most waitlists convert 2-3%. Know which of yours are the real 3% —
              before you ship
            </h1>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p className="max-w-2xl text-body-lg text-muted-foreground">
              Qualification questions • Warmth tracking • Referral quality score
              • Email broadcast • Live in 4mins • CSV export always free.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Link href="/onboarding/1">
              <Button size="lg" className="px-8 py-4 text-lg">
                Build it free — live in 4 mins →
              </Button>
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

export function Hero() {
  return (
    <Suspense fallback={null}>
      <HeroContent />
    </Suspense>
  );
}
