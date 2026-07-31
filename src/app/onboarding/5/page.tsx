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

  const isPro = form.tier === "pro" || form.tier === "growth";

  useEffect(() => {
    form.setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.waitlistId) {
      router.replace("/onboarding/1");
    }
  }, [form.waitlistId, router]);

  const handleLaunch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      setIsSubmitting(true);
      form.setLoading(true);

      try {
        if (!form.waitlistId) {
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
            id: form.waitlistId,
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
      <div className="mb-2 text-center">
        <p className="text-xs font-medium text-accent">Step 5 of 5</p>
        <p className="text-sm text-muted-foreground">
          Set up your confirmation email
        </p>
      </div>

      <h1 className="mb-2 text-center text-h2">
        Your subscribers get a confirmation email
      </h1>
      <p className="mb-8 text-center text-body text-muted-foreground">
        it includes their position and referral link automatically
      </p>

      {/* Free tier — email preview card */}
      {!isPro && (
        <div className="mb-8 flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-card p-6">
            {/* From line */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">From:</span> [Your
                name]
              </p>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 1L10 5.5L15 6.2L11.5 9.6L12.4 14.5L8 12.1L3.6 14.5L4.5 9.6L1 6.2L6 5.5L8 1Z"
                    fill="currentColor"
                  />
                </svg>
                PRO
              </span>
            </div>

            {/* Subject line */}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Subject:</span>{" "}
                [Customise on Pro]
              </p>
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground"
              >
                <path
                  d="M12 7H4V5C4 3.34 5.34 2 7 2C8.66 2 10 3.34 10 5V6H11C11.55 6 12 6.45 12 7V14H4V7H12ZM7 12C8.1 12 9 11.1 9 10C9 8.9 8.1 8 7 8C5.9 8 5 8.9 5 10C5 11.1 5.9 12 7 12Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* Body placeholder lines */}
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="h-2 w-full rounded-full bg-muted" />
              <div className="h-2 w-3/4 rounded-full bg-muted" />
              <div className="h-2 w-1/2 rounded-full bg-muted" />
            </div>

            {/* Upgrade CTA */}
            <button
              type="button"
              onClick={() => router.push("/pricing")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <span>Upgrade to Pro to customise</span>
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
            </button>
          </div>

          {/* Helper text */}
          <p className="text-sm text-muted-foreground">
            On the free plan, emails send from{" "}
            <span className="font-medium text-accent">MyWaitlist</span> with a
            standard template. Your product name and the subscriber&apos;s info
            are included automatically.
          </p>
        </div>
      )}

      {/* Pro tier — editable email fields */}
      {isPro && (
        <div className="mb-8 flex flex-col gap-5">
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
                    MyWaitlist&apos;s
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
      <div className="sticky bottom-0 flex w-full flex-col gap-4 bg-background pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14.75 w-full items-center justify-center gap-2 rounded-(--radius-md) bg-accent text-sm font-medium text-white transition-colors disabled:pointer-events-none disabled:opacity-50 md:w-161"
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
          href="/onboarding/4a"
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
