/**
 * Post-auth redirect intent shared by /signup, /signin, and /verify-email.
 *
 * A cold Pro-intent visitor arrives as `/signup?next=/dashboard/settings/billing&plan=pro`.
 * Every handoff (cookie, verify-email URL, signin link) must carry BOTH pieces —
 * dropping `plan` sends the founder to onboarding instead of checkout.
 */

/** Raw validated intent parsed from URL search params. */
export interface AuthIntent {
  /** Validated same-origin relative path, or null. */
  next: string | null;
  /** True when `?plan=pro` is present. */
  planPro: boolean;
  /**
   * Full post-auth destination: `next` (defaulting to billing when plan=pro),
   * with `plan=pro` appended when applicable. Null when no intent exists.
   */
  dest: string | null;
}

function validNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function getAuthIntent(
  searchParams: Pick<URLSearchParams, "get">
): AuthIntent {
  const next = validNext(searchParams.get("next"));
  const planPro = searchParams.get("plan") === "pro";
  const base = next ?? (planPro ? "/dashboard/settings/billing" : null);
  let dest: string | null = base;
  if (dest && planPro && !dest.includes("plan=pro")) {
    dest += (dest.includes("?") ? "&" : "?") + "plan=pro";
  }
  return { next, planPro, dest };
}

/** Cookie lifetime covers slow email-verification round trips (was 300s). */
export const AUTH_REDIRECT_COOKIE_MAX_AGE = 3600;

export function writeAuthRedirectCookie(dest: string): void {
  document.cookie = `auth_redirect_to=${dest}; path=/; max-age=${AUTH_REDIRECT_COOKIE_MAX_AGE}`;
}

/** Billing deep link that carries the pay-before-onboarding intent. */
export const PRO_INTENT_DEST = "/dashboard/settings/billing?plan=pro";

/** Where zero-waitlist Pro-intent founders must land for the upgrade modal. */
export const PRO_ONBOARDING_ENTRY = "/onboarding/1?plan=pro";

/**
 * Narrow dependencies {@link resolvePostAuthPath} needs. Callers pass small
 * closures over their supabase client — passing the client itself makes
 * TypeScript chase the query-builder generics into "excessively deep" errors.
 */
export interface PostAuthDeps {
  getUser(): PromiseLike<{ data: { user: { id: string } | null } }>;
  countOwnWaitlists(
    userId: string
  ): PromiseLike<{ count: number | null; error: unknown }>;
}

/** Build the deps object for {@link resolvePostAuthPath} from a supabase client. */
export function postAuthDeps(client: {
  auth: { getUser(): PromiseLike<{ data: { user: { id: string } | null } }> };
  from(table: string): unknown;
}): PostAuthDeps {
  return {
    getUser: () => client.auth.getUser(),
    countOwnWaitlists: (userId: string) =>
      (
        client.from("waitlists") as {
          select(
            columns: string,
            options: { count: "exact"; head: true }
          ): {
            eq(
              column: string,
              value: string
            ): PromiseLike<{ count: number | null; error: unknown }>;
          };
        }
      )
        .select("id", { count: "exact", head: true })
        .eq("founder_id", userId),
  };
}

/**
 * Resolve the post-auth landing path for a Pro-intent signup.
 *
 * Client-side navigation never passes `searchParams` to layouts, so a
 * zero-waitlist founder hitting `/dashboard/settings/billing?plan=pro` is
 * bounced by the dashboard layout to `/onboarding/1` with the intent lost.
 * Zero-waitlist founders therefore land on `/onboarding/1?plan=pro` instead,
 * where `PlanProAutoOpen` opens the upgrade modal. Mirrors the waitlist-count
 * branch in `src/app/auth/callback/route.ts` — keep both in sync.
 *
 * Auth-gating is the caller's job (mount effects check the session first;
 * sign-in submit paths are post-auth by construction). Pass `userId` when the
 * caller already resolved it to skip the extra `getUser` round trip. On any
 * failure the original destination is kept (same as the callback).
 */
export async function resolvePostAuthPath(
  deps: PostAuthDeps,
  dest: string | null | undefined,
  userId?: string
): Promise<string> {
  const fallback = dest ?? "/dashboard";
  if (dest !== PRO_INTENT_DEST) return fallback;
  try {
    let id = userId;
    if (!id) {
      const { data } = await deps.getUser();
      id = data.user?.id ?? undefined;
    }
    if (!id) return fallback;
    const { count, error } = await deps.countOwnWaitlists(id);
    if (!error && (count ?? 0) === 0) return PRO_ONBOARDING_ENTRY;
  } catch {
    // Keep the original destination on any failure — mirrors the callback.
  }
  return fallback;
}
