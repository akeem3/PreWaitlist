import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      if (user && !cookieRedirect) {
        const { data: waitlist } = await supabase
          .from("waitlists")
          .select("id, subdomain, headline, template, brand_color")
          .eq("founder_id", user.id)
          .single();

        if (!waitlist) {
          redirectPath = "/onboarding/1";
        } else {
          redirectPath = "/dashboard";
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
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
