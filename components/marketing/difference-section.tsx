"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { FadeIn } from "./animations";

export function DifferenceSection() {
  return (
    <section id="difference" className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-8 text-center">
          <FadeIn>
            <span
              className="text-base text-accent tracking-wide"
              style={{ fontWeight: 600 }}
            >
              The Difference
            </span>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2 className="max-w-3xl text-h2">
              Every tool gives you a list. This one tells you who on it actually
              matters.
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="max-w-2xl text-body-lg text-muted-foreground">
              Open your dashboard, and you&apos;d see something like this:
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col items-start gap-3 text-left">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                <p className="text-body-lg">
                  <strong className="text-accent">Sarah</strong>
                  {"\u00A0"}—{" "}
                  <span className="text-status-hot font-semibold">Hot</span>.
                  Opened every email. Told you what tool she&apos;s using now.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                <p className="text-body-lg">
                  <strong className="text-accent">James</strong>
                  {"\u00A0"}—{" "}
                  <span className="text-status-cold font-semibold">Cold</span>.
                  Signed up three months ago. Hasn&apos;t opened one since.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="max-w-2xl text-body-lg text-muted-foreground">
              You&apos;ll know who to email, and what to say to each one, before
              you send a single message.
            </p>
          </FadeIn>

          <FadeIn delay={0.5}>
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
