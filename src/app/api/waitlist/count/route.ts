import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Simple in-memory rate limiter (60 req/min per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const supabase = await createClient();

  // Look up the waitlist by subdomain
  const { data: waitlist, error: waitlistError } = await supabase
    .from("waitlists")
    .select("id, signup_counter_enabled, signup_counter_threshold")
    .eq("subdomain", slug)
    .single();

  if (waitlistError || !waitlist) {
    return NextResponse.json({ count: 0, visible: false });
  }

  if (!waitlist.signup_counter_enabled) {
    return NextResponse.json({ count: 0, visible: false });
  }

  // Count from subscribers via admin (no public SELECT after 14.0 RLS close)
  let count = 0;
  try {
    const admin = createAdminClient();
    const { count: subscriberCount } = await admin
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id);

    count = subscriberCount ?? 0;
  } catch {
    // subscribers table doesn't exist yet — return 0
    count = 0;
  }

  const threshold = waitlist.signup_counter_threshold || 10;

  return NextResponse.json({
    count,
    visible: count >= threshold,
  });
}
