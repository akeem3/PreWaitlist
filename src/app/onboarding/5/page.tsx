"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOnboardingForm } from "../context";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";

export default function OnboardingStep5() {
  const router = useRouter();
  const form = useOnboardingForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domainPanelOpen, setDomainPanelOpen] = useState(false);

  const isPro = form.tier === "pro";

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLaunch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      form.setLoading(true);

      try {
        // FlushGate already resolved server state — waitlistId is guaranteed
        const waitlistId = form.waitlistId;
        if (!waitlistId) {
          router.replace("/onboarding/1");
          return;
        }

        if (!form.slug) {
          const fallback = crypto.randomUUID().slice(0, 8);
          form.updateField("slug", fallback);
        }

        const slug = form.slug || crypto.randomUUID().slice(0, 8);

        const res = await fetch("/api/waitlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: waitlistId,
            subdomain: slug,
            email_sender_name: form.emailSenderName,
            email_subject: form.emailSubject,
            email_body: form.emailBody,
            status: "live",
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to launch waitlist");
        }

        router.push("/onboarding/success");
      } catch {
        setIsSubmitting(false);
        form.setLoading(false);
      }
    },
    [isSubmitting, form, router]
  );

  return (
    <form onSubmit={handleLaunch} className="flex flex-col">
      {/* Page header */}
      <div className="mb-1 text-center">
        <p className="text-xs font-medium text-accent">Step 5 of 5</p>
        <p className="text-sm text-muted-foreground">
          Set up your confirmation email
        </p>
      </div>

      <h1 className="mb-1 text-center text-h2">
        Your subscribers get a confirmation email
      </h1>
      <p className="mb-4 text-center text-body text-muted-foreground">
        it includes their position and referral link automatically
      </p>

      {/* Free tier — comparison card + email mock */}
      {!isPro && (
        <div className="mb-4 flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              What your subscribers receive
            </h3>

            {/* Email mock */}
            <div className="rounded-lg border border-border bg-background p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">From:</span>{" "}
                  {form.headline || "Your Product"} via PreWaitlist
                </p>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-2xs text-muted-foreground">
                  auto-sent
                </span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Subject:</span>{" "}
                  You&apos;re in! Position #1 on the{" "}
                  {form.headline || "your product"} waitlist
                </p>
              </div>
              <div className="space-y-1 border-t border-border pt-2">
                <p className="text-xs text-muted-foreground">Hey there,</p>
                <p className="text-xs text-muted-foreground">
                  You&apos;re signed up for the{" "}
                  {form.headline || "your product"} waitlist — position #1.
                  Share your referral link to move up:
                </p>
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5">
                  <span className="flex-1 truncate font-mono text-2xs text-muted-foreground">
                    {form.slug
                      ? `${form.slug}.prewaitlist.com/?ref=abc123`
                      : "your-page.prewaitlist.com/?ref=abc123"}
                  </span>
                </div>
                <p className="text-2xs text-muted-foreground">
                  The earlier you sign up, the higher your position.
                </p>
              </div>
            </div>

            {/* Upgrade button — inside card, below email mock */}
            <a
              href="/#pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent bg-accent/5 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <span>Upgrade to customise emails</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            {/* Comparison: Free vs Pro */}
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  Free
                </p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Confirmation email
                  </li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Position tracking
                  </li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Referral links
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="mb-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pro
                </p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Custom sender name
                  </li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Custom subject + body
                  </li>
                  <li className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <svg
                      className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Send from your domain
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro tier — editable email fields */}
      {isPro && (
        <div className="mb-4 flex flex-col gap-3">
          {/* Sender Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Sender name
            </label>
            <Input
              placeholder="Your Company"
              value={form.emailSenderName}
              onChange={(e) =>
                form.updateField("emailSenderName", e.target.value)
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Email subject
            </label>
            <Input
              placeholder="Welcome to the waitlist!"
              value={form.emailSubject}
              onChange={(e) => form.updateField("emailSubject", e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Message Body */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Message body
            </label>
            <Textarea
              placeholder="Thanks for signing up! We'll let you know when we launch."
              value={form.emailBody}
              onChange={(e) => form.updateField("emailBody", e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          {/* Send from your own domain */}
          <div className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setDomainPanelOpen(!domainPanelOpen)}
              className="flex w-full items-center justify-between p-5 text-sm"
            >
              <div>
                <span className="font-medium text-foreground">
                  Send from your own domain
                </span>{" "}
                <span className="text-muted-foreground">(recommended)</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-transform duration-200 ${domainPanelOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="px-5 pb-4 text-xs text-muted-foreground">
              Improves deliverability. Takes 2 minutes.
            </p>
            {domainPanelOpen && (
              <div className="border-t border-border px-5 pb-5 pt-4">
                {/* SPF record */}
                <div className="mb-3 flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      SPF record
                    </p>
                    <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                      v=spf1 include:_spf.google.com ~all
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ml-3 shrink-0 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Copy
                  </button>
                </div>

                {/* DKIM CNAME */}
                <div className="mb-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      DKIM CNAME
                    </p>
                    <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                      k=rsa; p=MIIBIjANBg...
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ml-3 shrink-0 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Copy
                  </button>
                </div>

                {/* Verify button */}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await fetch("/api/waitlist/verify-domain");
                    } catch {
                      // Stubbed — always returns unverified
                    }
                  }}
                  className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Verify my domain setup
                </button>

                {/* Skip link */}
                <p className="mb-3 text-xs text-muted-foreground">
                  Skip for now — send from{" "}
                  <span className="font-medium text-accent">
                    PreWaitlist&apos;s
                  </span>{" "}
                  domain
                </p>

                {/* Info box */}
                <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Why this matters:
                    </span>{" "}
                    emails from your own domain are less likely to land in spam.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Launch button */}
      <div className="sticky bottom-0 flex w-full flex-col gap-3 bg-background pb-10 pt-3 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14.75 w-full items-center justify-center gap-2 rounded-(--radius-md) bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <span>Launch my waitlist</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}
        </button>

        <Link
          href="/onboarding/4"
          className="inline-flex items-center justify-center gap-1 text-body-sm text-muted-foreground transition-colors duration-normal hover:text-foreground"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>
      </div>
    </form>
  );
}
