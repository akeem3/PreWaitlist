import { cookies } from "next/headers";
import { WAITLIST_PREF_COOKIE } from "./waitlist-pref-core";

/**
 * Server-readable mirror of the client's active-waitlist preference.
 *
 * The switcher persists the selected waitlist in localStorage
 * (`STORAGE_KEY` in components/dashboard/waitlist-switcher.tsx) — invisible
 * to Server Components. On any plain `/dashboard` entry (no `?wid`), the
 * server used to fall back to the newest waitlist while the client corrected
 * only the dropdown, so content and dropdown disagreed until a `?wid`
 * navigation. A readable cookie is the shared bridge both sides can see
 * (server via `cookies()`), giving server and client the same precedence:
 * `?wid > preference > newest`.
 *
 * Server-only: imported by layouts/pages. Client code must import
 * `waitlist-pref-core.ts` instead (same constants, `document.cookie`).
 */

export { WAITLIST_PREF_COOKIE };

export async function getStoredWaitlistPref(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(WAITLIST_PREF_COOKIE)?.value;
    return value ? decodeURIComponent(value) : null;
  } catch {
    // cookies() unavailable (e.g. static prerender) — fall back to newest.
    return null;
  }
}
