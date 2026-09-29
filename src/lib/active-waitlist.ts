import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 4.4: single home for "which waitlist is active" resolution.
 * Precedence: explicit `?wid` (validated against ownership) > stored
 * preference (client only) > newest. Every dashboard surface resolves the
 * same way — previously each section page rolled its own unordered
 * `maybeSingle`, and the overview even defaulted to the OLDEST list.
 */

interface WaitlistLike {
  id: string;
}

/**
 * Server flavor: resolve the active waitlist row for a founder. Validates
 * an explicit `wid` against ownership, otherwise returns the newest list.
 * `columns` lets each page fetch exactly what it renders (default `"id"`).
 * Returns null when the founder has no waitlists (callers redirect to
 * onboarding).
 */
export async function resolveActiveWaitlistRow<T extends WaitlistLike>(
  supabase: SupabaseClient,
  founderId: string,
  wid?: string | null,
  columns = "id"
): Promise<T | null> {
  if (wid) {
    const { data } = await supabase
      .from("waitlists")
      .select(columns)
      .eq("id", wid)
      .eq("founder_id", founderId)
      .maybeSingle();
    if (data) return data as unknown as T;
    // Invalid/foreign wid falls through to newest (matches the shell's
    // self-heal — never strand on a bad param).
  }

  const { data: newest } = await supabase
    .from("waitlists")
    .select(columns)
    .eq("founder_id", founderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (newest as unknown as T | null) ?? null;
}

/**
 * Client flavor: pure resolution over the layout-loaded waitlist array
 * (layout orders `created_at` ASC, so the last element is the newest —
 * same assumption the shell already makes). `storedId` is the localStorage
 * preference, which only exists client-side.
 */
export function resolveActiveWaitlist<T extends WaitlistLike>(
  waitlists: T[],
  opts?: { wid?: string | null; storedId?: string | null }
): T | null {
  if (waitlists.length === 0) return null;
  if (opts?.wid) {
    const byWid = waitlists.find((w) => w.id === opts.wid);
    if (byWid) return byWid;
  }
  if (opts?.storedId) {
    const byStored = waitlists.find((w) => w.id === opts.storedId);
    if (byStored) return byStored;
  }
  return waitlists[waitlists.length - 1];
}
