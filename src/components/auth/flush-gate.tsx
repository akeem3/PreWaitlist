"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthedOnboardingProvider,
  type OnboardingFormState,
} from "../../app/onboarding/context";

const STORAGE_KEY = "prewaitlist_onboarding";

function readStoredData(): Partial<OnboardingFormState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapServerToState(
  record: Record<string, unknown>
): OnboardingFormState {
  return {
    waitlistId: (record.waitlistId as string) ?? null,
    slug: (record.slug as string) ?? "",
    productName: (record.productName as string) ?? "",
    headline: (record.headline as string) ?? "",
    subheadline: (record.subheadline as string) ?? "",
    template: (record.template as "minimal" | "bold" | "dark") ?? "minimal",
    brandColor: (record.brandColor as string) ?? "#0F7A5E",
    logoUrl: (record.logoUrl as string) ?? null,
    ctaText: (record.ctaText as string) ?? "Join Waitlist",
    milestoneRewards:
      (record.milestoneRewards as OnboardingFormState["milestoneRewards"]) ??
      [],
    qualificationEnabled: (record.qualificationEnabled as boolean) ?? false,
    questions: (record.questions as OnboardingFormState["questions"]) ?? [],
    signupCounterEnabled: (record.signupCounterEnabled as boolean) ?? false,
    signupCounterThreshold: (record.signupCounterThreshold as number) ?? 10,
    emailSubject: (record.emailSubject as string) ?? "",
    emailSenderName: (record.emailSenderName as string) ?? "",
    emailBody: (record.emailBody as string) ?? "",
    tier: "free",
    loading: false,
  };
}

/**
 * FlushGate resolves server state once on mount, then renders children inside
 * AuthedOnboardingProvider.
 *
 * Ordering: POST (if local data) → confirm 2xx → GET full record → confirm
 * success → only then clear localStorage. Any failure preserves local data
 * and shows a retry UI.
 *
 * - If 404 from GET with no local data: redirect to Step 1 (truly fresh).
 * - Shows a branded spinner while resolving, retry button on failure.
 */
export function FlushGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [serverState, setServerState] = useState<OnboardingFormState | null>(
    null
  );
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const stored = readStoredData();
      const hasLocalData =
        stored &&
        (stored.slug || stored.headline || stored.template !== "minimal");

      try {
        // Step 1: POST local data to server (if any)
        if (hasLocalData) {
          const { waitlistId: _, loading: __, ...edits } = stored;
          void _;
          void __;

          const postBody = {
            subdomain: edits.slug || undefined,
            product_name: edits.productName || undefined,
            headline: edits.headline || undefined,
            subheadline: edits.subheadline || undefined,
            template: edits.template || undefined,
            brand_color: edits.brandColor || undefined,
            logo_url: edits.logoUrl || undefined,
            cta_text: edits.ctaText || undefined,
            milestone_rewards: edits.milestoneRewards || undefined,
            qualification_enabled: edits.qualificationEnabled ?? undefined,
            signup_counter_enabled: edits.signupCounterEnabled ?? undefined,
            signup_counter_threshold: edits.signupCounterThreshold ?? undefined,
            questions: edits.questions || undefined,
            email_subject: edits.emailSubject || undefined,
            email_sender_name: edits.emailSenderName || undefined,
            email_body: edits.emailBody || undefined,
          };
          const postRes = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postBody),
          });

          if (cancelled) return;

          if (!postRes.ok) {
            // POST failed — show retry, local data preserved
            if (!cancelled) setStatus("error");
            return;
          }
        }

        // Step 2: GET the full record (works for both flushed and existing)
        const getRes = await fetch("/api/waitlist");

        if (cancelled) return;

        // 404 with no local data → truly fresh user, go to Step 1
        if (getRes.status === 404 && !hasLocalData) {
          router.replace("/onboarding/1");
          return;
        }

        // 404 with local data → POST failed to create (shouldn't happen, but handle)
        if (getRes.status === 404) {
          if (!cancelled) setStatus("error");
          return;
        }

        if (!getRes.ok) {
          if (!cancelled) setStatus("error");
          return;
        }

        const record = await getRes.json();

        // Step 3: Only clear localStorage after both POST+GET succeeded
        if (hasLocalData && !cancelled) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // Ignore — worst case data is duplicated, not lost
          }
        }

        if (!cancelled) {
          setServerState(mapServerToState(record));
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">
          Something went wrong loading your waitlist.
        </p>
        <button
          onClick={() => {
            setStatus("loading");
            // Re-trigger effect by toggling a key — simplest approach
            window.location.reload();
          }}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!serverState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthedOnboardingProvider initial={serverState}>
      {children}
    </AuthedOnboardingProvider>
  );
}
