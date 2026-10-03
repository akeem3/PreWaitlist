"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthedOnboardingProvider,
  type OnboardingFormState,
} from "../../app/onboarding/context";
import { isPhoneMode } from "@/lib/phone";

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
    phoneMode: isPhoneMode(record.phoneMode) ? record.phoneMode : "off",
    tier: ((record.tier as string) ?? "free") as "free" | "pro",
    loading: false,
  };
}

/**
 * FlushGate resolves server state once on mount, then renders children inside
 * AuthedOnboardingProvider.
 *
 * Ordering: GET (pre-check) → POST local data only when no server record
 * exists → confirm 2xx → GET full record → confirm success → only then
 * clear localStorage. Any failure preserves local data and shows a retry UI.
 *
 * - 4.1: an existing server waitlist always wins — never blind-POST (a free
 *   founder's duplicate POST 402s; a pro founder's spawns a duplicate row).
 * - 4.1: headline-without-slug means Step 1 was never completed — route back
 *   to Step 1 instead of flushing an un-creatable draft.
 * - If the pre-check proves the server is empty (200 [] — GET never 404s —
 *   or 404) and there is no local draft: redirect to Step 1 (truly fresh).
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

      // 4.1: no slug means Step 1 was never completed — route back to
      // complete it. POSTing would 400 (subdomain required) into a dead end.
      if (hasLocalData && !stored.slug) {
        router.replace("/onboarding/1");
        return;
      }

      try {
        // 4.1: pre-check — GET before POST. An existing server record wins;
        // blind-POSTing a duplicate 402s for free founders ("Upgrade to Pro
        // to create more waitlists") and spawns a duplicate row for pro.
        let record: Record<string, unknown> | Record<string, unknown>[] | null =
          null;
        let getFailed = false;
        {
          const preRes = await fetch("/api/waitlist");
          if (cancelled) return;
          if (preRes.ok) {
            record = await preRes.json();
            if (Array.isArray(record) && record.length === 0) record = null;
          } else if (preRes.status !== 404) {
            getFailed = true;
          }
        }

        if (getFailed) {
          if (!cancelled) setStatus("error");
          return;
        }

        // Step 1: POST local data to server (only when no server record)
        if (hasLocalData && !record) {
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
            phone_mode: edits.phoneMode || undefined,
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

        // Step 2: GET the full record — only when we just POSTed (the
        // pre-check already loaded it otherwise; a proven-empty server with
        // no local data means truly fresh — no second request needed).
        if (!record) {
          // 4.1 truly fresh: the pre-check proved there is nothing on the
          // server (GET returns 200 [] for zero waitlists — it never 404s —
          // or a legacy 404) and we have no draft to flush. Route to Step 1
          // instead of a misleading error UI.
          if (!hasLocalData) {
            router.replace("/onboarding/1");
            return;
          }
          const getRes = await fetch("/api/waitlist");

          if (cancelled) return;

          // 404 after a successful POST → the record never materialized
          if (getRes.status === 404) {
            if (!cancelled) setStatus("error");
            return;
          }

          if (!getRes.ok) {
            if (!cancelled) setStatus("error");
            return;
          }

          record = await getRes.json();
          if (Array.isArray(record) && record.length === 0) record = null;
        }

        if (!record) {
          // Empty record with no path forward — retry surface, not a spinner.
          if (!cancelled) setStatus("error");
          return;
        }

        // GET now returns an array — take the most recently created waitlist
        const waitlistRecord = Array.isArray(record)
          ? record[record.length - 1]
          : record;

        // Step 3: Only clear localStorage after both POST+GET succeeded
        if (hasLocalData && !cancelled) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // Ignore — worst case data is duplicated, not lost
          }
        }

        if (!cancelled && waitlistRecord) {
          setServerState(mapServerToState(waitlistRecord));
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
        <div className="flex gap-3">
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
          <button
            type="button"
            onClick={() => {
              // 4.1 discard-draft escape: retrying replays the same failing
              // flush, so offer a way out — drop the local draft and restart
              // at Step 1 (same "Start fresh" label as the Step 1 prompt).
              try {
                localStorage.removeItem(STORAGE_KEY);
                sessionStorage.removeItem("prewaitlist_onboarding_active");
              } catch {
                // Ignore — navigation still gets them out of the dead end
              }
              router.replace("/onboarding/1");
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Start fresh
          </button>
        </div>
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
