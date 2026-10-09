/**
 * Shared preference-cookie constants + client-side accessors.
 *
 * Lives in its own module so BOTH sides can import it: the server helper
 * (`waitlist-pref.ts` → `cookies()`) and the client shell (`document.cookie`).
 * Never import `waitlist-pref.ts` (next/headers) from client components —
 * import this file instead.
 *
 * The cookie name intentionally equals `STORAGE_KEY` in
 * components/dashboard/waitlist-switcher.tsx (localStorage) — one preference,
 * two synchronized stores: localStorage for the client, cookie for the server.
 */

export const WAITLIST_PREF_COOKIE = "active_waitlist_id";

/** 1 year — the preference must survive browser restarts (founder rule: land
 *  on the waitlist you were on before you left the site). */
export const WAITLIST_PREF_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readWaitlistPrefCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${WAITLIST_PREF_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(WAITLIST_PREF_COOKIE.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function writeWaitlistPrefCookie(waitlistId: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${WAITLIST_PREF_COOKIE}=${encodeURIComponent(waitlistId)}; path=/; max-age=${WAITLIST_PREF_COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    // Cookie writes unavailable (private mode) — localStorage still holds
    // the preference; the server falls back to newest until a ?wid visit.
  }
}
