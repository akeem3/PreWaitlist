import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("[auth/callback] Hit:", {
    origin,
    hasCode: !!code,
    error,
    errorDescription,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    cookieRedirect: request.cookies.get("auth_redirect_to")?.value,
    allParams: Object.fromEntries(searchParams.entries()),
  });

  if (error) {
    console.error(
      "[auth/callback] OAuth error from provider:",
      error,
      errorDescription
    );
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const cookieRedirect = request.cookies.get("auth_redirect_to")?.value;
  const next = cookieRedirect || searchParams.get("next") || "/dashboard";

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

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    console.log("[auth/callback] Exchange result:", {
      hasError: !!exchangeError,
      errorMessage: exchangeError?.message,
      errorStatus: exchangeError?.status,
    });

    if (!exchangeError) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log(
        "[auth/callback] Session established, redirecting to:",
        next,
        {
          hasUser: !!user,
          userId: user?.id,
        }
      );

      // Capture acquisition source from cookie
      const acquisitionCookie = request.cookies.get("mw_acquisition")?.value;
      if (user && acquisitionCookie) {
        try {
          const acquisition = JSON.parse(acquisitionCookie);
          await supabase
            .from("founder_profiles")
            .update({
              ref_param: acquisition.ref ?? null,
              utm_source: acquisition.utm_source ?? null,
              utm_medium: acquisition.utm_medium ?? null,
              utm_campaign: acquisition.utm_campaign ?? null,
              acquisition_captured_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        } catch {
          // Silent fail — acquisition capture is best-effort
        }
      }

      let redirectPath = next;

      if (!cookieRedirect && !searchParams.get("next")) {
        redirectPath = "/dashboard";
      }

      const response = NextResponse.redirect(`${origin}${redirectPath}`, 302);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
      });
      response.cookies.delete("auth_redirect_to");
      response.cookies.delete("mw_acquisition");
      return response;
    }

    console.error("[auth/callback] Code exchange failed:", exchangeError);
  }

  console.log("[auth/callback] Falling through to error page");
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
