/**
 * Post-confirmation redirect + acquisition logic shared by the two auth
 * verification entry points:
 *
 * - `src/app/auth/callback/route.ts` — PKCE code exchange (Google OAuth and
 *   legacy email links that still carry `?code=`)
 * - `src/app/auth/confirm/route.ts` — `token_hash` server-side verification
 *   (the email templates' cross-device-safe link)
 *
 * Both routes must resolve the landing path identically: acquisition capture,
 * `auth_redirect_to` intent, and the `?plan=pro` waitlist-count branch
 * (layouts never receive searchParams — see resolvePostAuthPath).
 */

import {
  PRO_INTENT_DEST,
  PRO_ONBOARDING_ENTRY,
  validNext,
} from "./auth-redirect";

/** Diagnostic redirect URL for the auth-code-error page (machine-readable `?d=` payload). */
export function authErrorUrl(
  origin: string,
  diag: Record<string, string | number>
): string {
  return `${origin}/auth/auth-code-error?d=${encodeURIComponent(
    JSON.stringify(diag)
  )}`;
}

/**
 * Narrow client surface used here — `{ from(table): unknown }` with internal
 * casts keeps TypeScript away from the query-builder generics
 * ("type instantiation is excessively deep" gotcha).
 */
export interface PostConfirmClient {
  from(table: string): unknown;
}

export interface PostConfirmDeps {
  /** Authenticated user returned by the verification step, or null. */
  user: { id: string } | null;
  /** Raw `mw_acquisition` cookie value (best-effort UTM capture). */
  acquisitionCookie?: string;
  /** Raw `auth_redirect_to` cookie value (post-auth intent). */
  cookieRedirect?: string;
  /** `?next=` path from the incoming URL. */
  nextParam?: string | null;
  /** Landing path when neither cookie nor param carries intent. */
  defaultPath?: string;
}

/**
 * Resolve the post-confirmation landing path, capturing acquisition data on
 * the way. Mirrors the historical `/auth/callback` behaviour exactly:
 *
 * 1. best-effort `founder_profiles` upsert from `mw_acquisition`
 * 2. landing path = sanitized cookie → sanitized `next` → default
 * 3. `?plan=pro` intent with zero waitlists → onboarding entry
 */
export async function resolvePostConfirmRedirect(
  client: PostConfirmClient,
  deps: PostConfirmDeps
): Promise<string> {
  const {
    user,
    acquisitionCookie,
    cookieRedirect,
    nextParam,
    defaultPath = "/dashboard",
  } = deps;

  // 1. Acquisition capture — best-effort, never blocks the redirect.
  if (user && acquisitionCookie) {
    try {
      const acquisition = JSON.parse(acquisitionCookie);
      await (
        client.from("founder_profiles") as {
          upsert(
            row: Record<string, unknown>,
            options: { onConflict: string }
          ): PromiseLike<unknown>;
        }
      ).upsert(
        {
          id: user.id,
          ref_param: acquisition.ref ?? null,
          utm_source: acquisition.utm_source ?? null,
          utm_medium: acquisition.utm_medium ?? null,
          utm_campaign: acquisition.utm_campaign ?? null,
          acquisition_captured_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch {
      // Silent fail — acquisition capture is best-effort
    }
  }

  // 2. Landing path: intent cookie → next param → type-specific default.
  let redirectPath =
    validNext(cookieRedirect ?? null) ??
    validNext(nextParam ?? null) ??
    defaultPath;

  // 3. ?plan=pro pay-before-onboarding: branch on waitlist count here, since
  // layouts never receive searchParams. Zero waitlists → onboarding step 1
  // with the upgrade modal auto-opened. Keep the count semantics in sync
  // with the client-side resolvePostAuthPath (src/lib/auth-redirect.ts).
  if (user && redirectPath === PRO_INTENT_DEST) {
    try {
      const { count, error } = await (
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
        .eq("founder_id", user.id);
      if (!error && (count ?? 0) === 0) {
        redirectPath = PRO_ONBOARDING_ENTRY;
      }
    } catch {
      // Keep the original destination on query failures — billing renders.
    }
  }

  return redirectPath;
}
