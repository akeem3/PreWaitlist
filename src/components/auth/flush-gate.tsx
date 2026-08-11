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
 * - If localStorage has data: POST it to create the waitlist, then GET the
 *   full record, then clear localStorage.
 * - If localStorage is empty: GET the existing waitlist.
 * - If 404: redirect to Step 1 (deleted account edge case).
 * - Shows a skeleton while resolving.
 */
export function FlushGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [serverState, setServerState] = useState<OnboardingFormState | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const stored = readStoredData();
      const hasLocalData =
        stored &&
        (stored.slug || stored.headline || stored.template !== "minimal");

      try {
        let res: Response;

        if (hasLocalData) {
          // Phase A → Phase B: flush localStorage to server
          const { waitlistId: _, loading: __, ...edits } = stored;
          void _;
          void __;

          const postRes = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subdomain: edits.slug || undefined,
              headline: edits.headline || undefined,
              subheadline: edits.subheadline || undefined,
              template: edits.template || undefined,
              brand_color: edits.brandColor || undefined,
              logo_url: edits.logoUrl || undefined,
              cta_text: edits.ctaText || undefined,
              milestone_rewards: edits.milestoneRewards || undefined,
              qualification_enabled: edits.qualificationEnabled || undefined,
              signup_counter_enabled: edits.signupCounterEnabled || undefined,
              signup_counter_threshold:
                edits.signupCounterThreshold || undefined,
              questions: edits.questions || undefined,
              email_subject: edits.emailSubject || undefined,
              email_sender_name: edits.emailSenderName || undefined,
              email_body: edits.emailBody || undefined,
            }),
          });

          if (!cancelled) {
            localStorage.removeItem(STORAGE_KEY);
          }

          if (!postRes.ok) {
            // POST failed — try GET as fallback (waitlist may already exist)
            res = await fetch("/api/waitlist");
          } else {
            // POST succeeded — GET the full record (POST only returns { id })
            res = await fetch("/api/waitlist");
          }
        } else {
          // No local data — fetch existing server state
          res = await fetch("/api/waitlist");
        }

        if (cancelled) return;

        if (res.status === 404) {
          router.replace("/onboarding/1");
          return;
        }

        if (!res.ok) {
          // Fail open — render with empty state
          setServerState(initialState);
          return;
        }

        const record = await res.json();
        if (!cancelled) {
          setServerState(mapServerToState(record));
        }
      } catch {
        if (!cancelled) {
          // Fail open
          setServerState(initialState);
        }
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [router]);

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

// Fallback state for error cases
const initialState: OnboardingFormState = {
  waitlistId: null,
  slug: "",
  headline: "",
  subheadline: "",
  template: "minimal",
  brandColor: "#0F7A5E",
  logoUrl: null,
  ctaText: "Join Waitlist",
  milestoneRewards: [],
  qualificationEnabled: false,
  questions: [],
  signupCounterEnabled: false,
  signupCounterThreshold: 10,
  emailSubject: "",
  emailSenderName: "",
  emailBody: "",
  tier: "free",
  loading: false,
};
