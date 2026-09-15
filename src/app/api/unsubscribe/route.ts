import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

/**
 * RFC 8058 one-click unsubscribe endpoint.
 *
 * POST: Silently processes unsubscribe, returns 200 with blank body.
 * GET: Redirects to the unsubscribe confirmation page.
 */
export async function POST(req: NextRequest) {
  let token: string | null = null;

  // Check body first, then query string
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      token = params.get("token");
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      token = body.token;
    }
  } catch {
    // Ignore parse errors
  }

  if (!token) {
    const url = new URL(req.url);
    token = url.searchParams.get("token");
  }

  if (!token) {
    return new NextResponse(null, { status: 400 });
  }

  const subscriberId = verifyUnsubscribeToken(token);
  if (!subscriberId) {
    return new NextResponse(null, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Idempotent: set unsubscribed_at (even if already set)
  await adminSupabase
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriberId);

  // RFC 8058: return 200 with blank body
  return new NextResponse(null, { status: 200 });
}

/**
 * GET requests redirect to the existing unsubscribe confirmation page.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe", req.url));
  }

  return NextResponse.redirect(new URL(`/unsubscribe?token=${token}`, req.url));
}
