import posthog from "posthog-js";

export type CaptureProperties = Record<
  string,
  string | number | boolean | null
>;

export interface CaptureOptions {
  /**
   * Marks events that trigger PostHog surveys. Suppressed while the
   * upgrade modal (or, later, the dashboard walkthrough) is open so
   * survey popups never stack on top of modals (Story 20.1, D7).
   */
  surveyTrigger?: boolean;
}

let initialized = false;
let enabled = false;
let surveySuppressed = false;

/**
 * Story 20.1 AC1 — initialize PostHog from instrumentation-client.ts.
 * No-op when NEXT_PUBLIC_POSTHOG_KEY is absent (local dev must not error).
 */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
  posthog.init(key, {
    api_host: host,
    // Story 20.1 D4 — official PostHog defaults preset (autocapture ON,
    // pageviews, sampled session replay within the free-tier budget).
    defaults: "2026-05-30",
  });
  enabled = true;
}

/**
 * Safe capture for every call site. Never throws, never sends when the
 * SDK is uninitialized (tests, local dev without a key). Never pass
 * subscriber PII in `properties` (Story 20.1 AC3).
 */
export function capture(
  event: string,
  properties?: CaptureProperties,
  options?: CaptureOptions
): void {
  if (!enabled) return;
  if (options?.surveyTrigger && surveySuppressed) return;
  posthog.capture(event, properties);
}

/** Story 20.1 D6 — tie all dashboard events to the signed-in founder. */
export function identifyFounder(
  founderId: string,
  properties?: CaptureProperties
): void {
  if (!enabled) return;
  posthog.identify(founderId, properties);
}

/** Context attached to every subsequent event (tier, waitlist_id — AC3). */
export function registerContext(properties: CaptureProperties): void {
  if (!enabled) return;
  posthog.register(properties);
}

/** Story 20.1 D7 — gate survey-trigger events while a modal owns the UI. */
export function setSurveySuppressed(suppressed: boolean): void {
  surveySuppressed = suppressed;
}
