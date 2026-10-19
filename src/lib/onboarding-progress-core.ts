/**
 * "Onboarding in progress" cookie — bridges the Phase-A localStorage draft
 * to the server-side OnboardingGuard.
 *
 * Why: the guard (a Server Component) redirects any free founder with ≥1
 * waitlist away from every /onboarding/* route. That made mid-flow resume
 * impossible: once FlushGate created the waitlist at the Step-3→4 wall,
 * leaving/reloading /onboarding/1|4|4a|5 bounced to /dashboard
 * (QA Batch 2 TC-ONB-14a). localStorage is invisible server-side, so the
 * guard cannot tell "re-running the wizard over an existing waitlist" from
 * "resuming an unfinished draft". The cookie is the server-visible draft
 * signal: written by LocalOnboardingProvider only once the persisted draft
 * contains actual founder input (hasOnboardingProgress — a defaults-only
 * mount payload does NOT qualify), cleared by clearPersisted() on the success
 * screen and by clearDraft() on "start fresh".
 *
 * Same pattern as waitlist-pref-core.ts (client-safe module imported by
 * both the client writer and the server reader).
 */

export const ONBOARDING_PROGRESS_COOKIE = "onboarding_in_progress";

/** 1 day — matches the localStorage draft TTL window; a stale cookie never
 *  outlives the draft it represents. */
export const ONBOARDING_PROGRESS_COOKIE_MAX_AGE = 60 * 60 * 24;

/** Client-side: mark a draft in progress (call after persisting). */
export function writeOnboardingProgressCookie(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${ONBOARDING_PROGRESS_COOKIE}=1; path=/; max-age=${ONBOARDING_PROGRESS_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    // Private mode — guard falls back to redirect (pre-fix behavior).
  }
}

/** Client-side: clear on success / explicit draft wipe. */
export function clearOnboardingProgressCookie(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${ONBOARDING_PROGRESS_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // Ignore
  }
}
