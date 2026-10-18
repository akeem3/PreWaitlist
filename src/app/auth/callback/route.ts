import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  authErrorUrl,
  resolvePostConfirmRedirect,
} from "@/lib/auth-post-confirm";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const cookieRedirect = request.cookies.get("auth_redirect_to")?.value;

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
    authErrorUrl(origin, diag);

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

    // Acquisition capture, intent-cookie landing path, and the ?plan=pro
    // waitlist-count branch are shared with /auth/confirm — see
    // src/lib/auth-post-confirm.ts.
    const acquisitionCookie = request.cookies.get("mw_acquisition")?.value;
    const redirectPath = await resolvePostConfirmRedirect(supabase, {
      user,
      acquisitionCookie,
      cookieRedirect,
      nextParam: searchParams.get("next"),
      defaultPath: "/dashboard",
    });

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
