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
  const utmSource = url.searchParams.get("utm_source");
  const utmMedium = url.searchParams.get("utm_medium");
  const utmCampaign = url.searchParams.get("utm_campaign");
  const utmTerm = url.searchParams.get("utm_term");
  const utmContent = url.searchParams.get("utm_content");

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
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);
  console.log(
    `[middleware] host=${host} subdomain=${subdomain} pathname=${request.nextUrl.pathname}`
  );

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
  url.pathname = path.startsWith(`/${subdomain}`)
    ? path
    : `/${subdomain}${path}`;
  console.log(`[middleware] rewriting to ${url.pathname}`);
  return NextResponse.rewrite(url);
}
