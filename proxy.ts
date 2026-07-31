import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./src/lib/supabase/middleware";

const RESERVED_SLUGS = [
  "app",
  "api",
  "auth",
  "dashboard",
  "onboarding",
  "signin",
  "signup",
  "verify-email",
  "forgot-password",
  "reset-password",
  "www",
  "mail",
  "admin",
  "help",
  "status",
];

function getSubdomain(host: string): string | null {
  // Strip port if present
  const hostname = host.split(":")[0];

  // localhost: just return null (no subdomain routing on localhost)
  if (hostname === "localhost") return null;

  // lvh.me: any *.lvh.me resolves to 127.0.0.1
  if (hostname.endsWith(".lvh.me")) {
    return hostname.split(".")[0];
  }

  // Production: *.mywaitlist.com or *.vercel.app
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /api/* (API routes)
     * - /_next/* (Next.js internals)
     * - /auth/* (auth routes — signin, signup, callback)
     * - Static files (favicon.ico, images, etc.)
     *
     * NOTE: /onboarding/* and /dashboard ARE included so the auth guard
     * can protect them. The subdomain rewrite logic skips reserved slugs.
     */
    "/((?!api/|_next/|auth/|favicon.ico|.*\\..*).*)",
  ],
};

function captureAcquisition(request: NextRequest): NextResponse | null {
  const url = request.nextUrl;

  // Only capture on the marketing homepage
  if (url.pathname !== "/") return null;

  const ref = url.searchParams.get("ref");
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");
  const utmTerm = url.searchParams.get("utm_term");
  const utmContent = url.searchParams.get("utm_content");

  // If no acquisition params present, do nothing
  if (
    !ref &&
    !utmSource &&
    !utmMedium &&
    !utmCampaign &&
    !utmTerm &&
    !utmContent
  ) {
    return null;
  }

  const acquisition: Record<string, string> = {};
  if (ref) acquisition.ref = ref;
  if (utmSource) acquisition.utm_source = utmSource;
  if (utmMedium) acquisition.utm_medium = utmMedium;
  if (utmCampaign) acquisition.utm_campaign = utmCampaign;
  if (utmTerm) acquisition.utm_term = utmTerm;
  if (utmContent) acquisition.utm_content = utmContent;

  const response = NextResponse.next();
  response.cookies.set("mw_acquisition", JSON.stringify(acquisition), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // Capture acquisition params on marketing homepage
  const acquisitionResponse = captureAcquisition(request);

  // No subdomain on localhost or apex domain — apply auth guard
  if (!subdomain) {
    const sessionResponse = await updateSession(request);
    // Merge acquisition cookie if it was set
    if (acquisitionResponse) {
      for (const cookie of acquisitionResponse.cookies.getAll()) {
        sessionResponse.cookies.set(cookie);
      }
    }
    return sessionResponse;
  }

  // Reserved slugs — serve the app's own pages, apply auth guard
  if (RESERVED_SLUGS.includes(subdomain)) {
    const sessionResponse = await updateSession(request);
    if (acquisitionResponse) {
      for (const cookie of acquisitionResponse.cookies.getAll()) {
        sessionResponse.cookies.set(cookie);
      }
    }
    return sessionResponse;
  }

  // Rewrite to the [subdomain] dynamic route (no auth guard for tenant pages)
  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}
