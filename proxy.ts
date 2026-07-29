import { type NextRequest, NextResponse } from "next/server";

const RESERVED_SLUGS = [
  "app",
  "api",
  "auth",
  "dashboard",
  "onboarding",
  "signin",
  "signup",
  "verify-email",
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
     * - /onboarding/* (onboarding wizard)
     * - /dashboard (dashboard)
     * - Static files (favicon.ico, images, etc.)
     */
    "/((?!api/|_next/|auth/|onboarding/|dashboard|favicon.ico|.*\\..*).*)",
  ],
};

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // No subdomain on localhost or apex domain — serve normally
  if (!subdomain) {
    return NextResponse.next();
  }

  // Reserved slugs — serve the app's own pages, not a waitlist
  if (RESERVED_SLUGS.includes(subdomain)) {
    return NextResponse.next();
  }

  // Rewrite to the [subdomain] dynamic route
  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}
