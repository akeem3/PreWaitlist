import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PRO_INTENT_DEST, PRO_ONBOARDING_ENTRY } from "@/lib/auth-redirect";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const cookieRedirect = request.cookies.get("auth_redirect_to")?.value;
  const next = cookieRedirect || searchParams.get("next") || "/dashboard";

  // PKCE diagnostic: cookie names only (never values) — distinguishes
  // "verifier cookie absent" from "verifier present but rejected".
  const verifierCookieNames = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((name) => name.includes("code-verifier"));

  // The same diagnostic is embedded in the error redirect (?d=) so it is
  // readable straight from the URL the founder reports back — no Vercel
  // log access needed. Values only, no cookie contents.
  const errorUrl = (diag: Record<string, string | number>) =>
    `${origin}/auth/auth-code-error?d=${encodeURIComponent(JSON.stringify(diag))}`;

  if (code) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth-callback] exchange failed", {
        name: error.name,
        status: error.status,
        message: error.message,
        hasVerifierCookie: verifierCookieNames.length > 0,
        verifierCookieNames,
        flowIdParam: searchParams.get("sb_flow_id"),
      });
      return NextResponse.redirect(
        errorUrl({
          c: 1,
          v: verifierCookieNames.length > 0 ? 1 : 0,
          n: verifierCookieNames.join(","),
          f: searchParams.get("sb_flow_id") ?? "",
          e: error.name,
          s: error.status ?? 0,
          m: error.message,
        })
      );
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Capture acquisition source from cookie
    const acquisitionCookie = request.cookies.get("mw_acquisition")?.value;
    if (user && acquisitionCookie) {
      try {
        const acquisition = JSON.parse(acquisitionCookie);
        await supabase.from("founder_profiles").upsert(
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

    let redirectPath = next;

    // If no specific redirect was requested (no cookie, no next param),
    // default to dashboard. The dashboard layout is the single source of
    // truth — it checks for waitlists and redirects to onboarding if needed.
    if (!cookieRedirect && !searchParams.get("next")) {
      redirectPath = "/dashboard";
    }

    // ?plan=pro pay-before-onboarding: branch on waitlist count here, since
    // layouts never receive searchParams (the dashboard layout exception was
    // dead code). Zero waitlists → onboarding step 1 with the upgrade modal
    // auto-opened; one or more → billing (its own ?plan=pro auto-open runs).
    // Destinations are shared with the client-side resolvePostAuthPath
    // (src/lib/auth-redirect.ts) via PRO_INTENT_DEST/PRO_ONBOARDING_ENTRY —
    // keep the count semantics in sync between the two.
    if (user && redirectPath === PRO_INTENT_DEST) {
      try {
        const { count, error } = await supabase
          .from("waitlists")
          .select("id", { count: "exact", head: true })
          .eq("founder_id", user.id);
        if (!error && (count ?? 0) === 0) {
          redirectPath = PRO_ONBOARDING_ENTRY;
        }
      } catch {
        // Keep the original destination on query failures — billing renders.
      }
    }

    const response = NextResponse.redirect(`${origin}${redirectPath}`, 302);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
    response.cookies.delete("auth_redirect_to");
    response.cookies.delete("mw_acquisition");
    return response;
  }

  console.error("[auth-callback] no code or exchange failed", {
    hasCode: Boolean(code),
    hasVerifierCookie: verifierCookieNames.length > 0,
    verifierCookieNames,
    flowIdParam: searchParams.get("sb_flow_id"),
    url: request.url,
  });

  return NextResponse.redirect(
    errorUrl({
      c: code ? 1 : 0,
      v: verifierCookieNames.length > 0 ? 1 : 0,
      n: verifierCookieNames.join(","),
      f: searchParams.get("sb_flow_id") ?? "",
      u: request.url,
    })
  );
}
