import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

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
  const hostname = host.split(":")[0];
  if (hostname === "localhost") return null;
  if (hostname.endsWith(".lvh.me")) {
    return hostname.split(".")[0];
  }
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

export const config = {
  matcher: ["/((?!api/|_next/|auth/|favicon.ico|.*\\..*).*)"],
};

function captureAcquisition(request: NextRequest): NextResponse | null {
  const url = request.nextUrl;
  if (url.pathname !== "/") return null;

  const ref = url.searchParams.get("ref");
  // "Powered by" footer attribution (?src=powered-by) lands in the same
  // ref_param column as legacy ?ref= values — explicit ref wins if both.
  const src = url.searchParams.get("src");
  const acquisitionRef = ref ?? src;
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");
  const utmTerm = url.searchParams.get("utm_term");
  const utmContent = url.searchParams.get("utm_content");

  if (
    !acquisitionRef &&
    !utmSource &&
    !utmMedium &&
    !utmCampaign &&
    !utmTerm &&
    !utmContent
  ) {
    return null;
  }

  const acquisition: Record<string, string> = {};
  if (acquisitionRef) acquisition.ref = acquisitionRef;
  if (utmSource) acquisition.utm_source = utmSource;
  if (utmMedium) acquisition.utm_medium = utmMedium;
  if (utmCampaign) acquisition.utm_campaign = utmCampaign;
  if (utmTerm) acquisition.utm_term = utmTerm;
  if (utmContent) acquisition.utm_content = utmContent;

  // Share the cookie across the apex and all founder subdomains; only the
  // server (auth callback) reads it. Host-only on localhost/lvh.me dev hosts.
  const hostname = url.hostname;
  const cookieDomain =
    hostname === "prewaitlist.com" || hostname.endsWith(".prewaitlist.com")
      ? ".prewaitlist.com"
      : undefined;

  const response = NextResponse.next();
  response.cookies.set("mw_acquisition", JSON.stringify(acquisition), {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: url.protocol === "https:",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return response;
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  const acquisitionResponse = captureAcquisition(request);

  if (!subdomain) {
    const sessionResponse = await updateSession(request);
    if (acquisitionResponse) {
      for (const cookie of acquisitionResponse.cookies.getAll()) {
        sessionResponse.cookies.set(cookie);
      }
    }
    return sessionResponse;
  }

  if (RESERVED_SLUGS.includes(subdomain)) {
    const sessionResponse = await updateSession(request);
    if (acquisitionResponse) {
      for (const cookie of acquisitionResponse.cookies.getAll()) {
        sessionResponse.cookies.set(cookie);
      }
    }
    return sessionResponse;
  }

  const url = request.nextUrl.clone();
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  // Shared compliance routes exist only at the root (there are no
  // per-subdomain legal/unsubscribe pages). Legal links on public waitlist
  // pages are host-relative, so a subdomain host would otherwise rewrite
  // /legal/terms to /{subdomain}/legal/terms and 404. Serve the root route.
  const isSharedPublicPath =
    path === "/legal" ||
    path.startsWith("/legal/") ||
    path === "/unsubscribe" ||
    path.startsWith("/unsubscribe/");
  url.pathname =
    path.startsWith(`/${subdomain}`) || isSharedPublicPath
      ? path
      : `/${subdomain}${path}`;
  const rewriteResponse = NextResponse.rewrite(url);
  // Preserve acquisition attribution on subdomain rewrites — previously
  // this branch discarded the capture response and dropped the cookie.
  if (acquisitionResponse) {
    for (const cookie of acquisitionResponse.cookies.getAll()) {
      rewriteResponse.cookies.set(cookie);
    }
  }
  return rewriteResponse;
}
