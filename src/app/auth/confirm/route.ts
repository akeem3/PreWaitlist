import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  authErrorUrl,
  resolvePostConfirmRedirect,
} from "@/lib/auth-post-confirm";

/**
 * Server-side email-link verification via `token_hash` + `verifyOtp`.
 *
 * The Confirm-signup and Reset-password email templates link here
 * (`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
 * — or `type=recovery`). Unlike the PKCE `?code=` flow, `verifyOtp` needs
 * no code-verifier cookie, so the link works on any device/browser and
 * survives verifier wipes (failed-signup retries, session teardown).
 * Google OAuth keeps using /auth/callback (same-context PKCE — safe).
 */

const CONFIRM_TYPES = ["signup", "recovery"] as const;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = CONFIRM_TYPES.find((t) => t === rawType) ?? null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      authErrorUrl(origin, {
        c: 0,
        t: rawType ?? "",
        m: "missing token_hash or unsupported type",
      })
    );
  }

  const cookieRedirect = request.cookies.get("auth_redirect_to")?.value;
  const acquisitionCookie = request.cookies.get("mw_acquisition")?.value;

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

  const {
    data: { user },
    error,
  } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error || !user) {
    console.error("[auth-confirm] verifyOtp failed", {
      type,
      name: error?.name,
      status: error?.status,
      message: error?.message,
      hasUser: Boolean(user),
    });
    return NextResponse.redirect(
      authErrorUrl(origin, {
        c: 1,
        t: type,
        e: error?.name ?? "missing_user",
        s: error?.status ?? 0,
        m: error?.message ?? "no user returned",
      })
    );
  }

  const redirectPath = await resolvePostConfirmRedirect(supabase, {
    user,
    acquisitionCookie,
    cookieRedirect,
    nextParam: searchParams.get("next"),
    defaultPath: type === "recovery" ? "/reset-password" : "/dashboard",
  });

  const response = NextResponse.redirect(`${origin}${redirectPath}`, 302);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });
  response.cookies.delete("auth_redirect_to");
  response.cookies.delete("mw_acquisition");
  return response;
}
