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

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // No subdomain on localhost or apex domain — apply auth guard
  if (!subdomain) {
    return updateSession(request);
  }

  // Reserved slugs — serve the app's own pages, apply auth guard
  if (RESERVED_SLUGS.includes(subdomain)) {
    return updateSession(request);
  }

  // Rewrite to the [subdomain] dynamic route (no auth guard for tenant pages)
  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}
