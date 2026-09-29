import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

/**
 * 4.6: resubscribing is state-changing, so it requires POST (link
 * prefetchers and email scanners GET links — a GET that mutates can fire
 * without the human ever clicking). The GET page only validates the token
 * and renders a confirm button that posts here. The update is verified
 * (matched row required) — no silent success.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = body?.token;

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const subscriberId = verifyUnsubscribeToken(token);
  if (!subscriberId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscribers")
    .update({ unsubscribed_at: null })
    .eq("id", subscriberId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
