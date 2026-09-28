import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/tier-gating";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // AC3: tier gate before any waitlist work — Free always gets 403 JSON
  // (never a 404 that leaks whether a wid exists), mirroring broadcast/route.ts.
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  const tierCheck = requirePro(profile?.tier ?? "free", "Broadcast");
  if (!tierCheck.allowed) {
    return NextResponse.json({ error: tierCheck.reason }, { status: 403 });
  }

  // Story 17.1 AC1: accept the active waitlist id (client sends `wid`;
  // `waitlist_id` also accepted). Always founder-scoped. NOTE on the
  // .maybeSingle() null trap: null means "zero OR ambiguous", never assume
  // "not found" — so the no-wid path fetches an array and branches on
  // length explicitly (0 → 404, 2+ → 400). The wid path filters by PK `id`,
  // so at most one row can match and .maybeSingle() is safe there.
  const { searchParams } = new URL(request.url);
  const wid = searchParams.get("wid") ?? searchParams.get("waitlist_id");

  let waitlistId: string;
  if (wid) {
    const { data: waitlist } = await supabase
      .from("waitlists")
      .select("id")
      .eq("founder_id", user.id)
      .eq("id", wid)
      .maybeSingle();

    if (!waitlist) {
      return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
    }
    waitlistId = waitlist.id;
  } else {
    const { data: rows } = await supabase
      .from("waitlists")
      .select("id")
      .eq("founder_id", user.id);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
    }
    if (rows.length > 1) {
      return NextResponse.json(
        { error: "wid is required when multiple waitlists exist" },
        { status: 400 }
      );
    }
    waitlistId = rows[0].id;
  }

  // Story 17.1 AC3 (B3): counts must equal send-time eligible recipients —
  // identical rules to POST broadcast (Story 17.0 AC5): unsubscribed_at IS
  // NULL and email not in active bounced set. Computed in memory (no
  // not-in URL-length cap, no quoting pitfalls) to match the send path.
  // Mirrors isEmailBounced() semantics: hard bounces suppress forever,
  // soft bounces only within 24h.
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email, warmth_score, unsubscribed_at")
    .eq("waitlist_id", waitlistId);

  const { data: bouncedRows } = await supabase
    .from("bounced_emails")
    .select("email, bounce_type, created_at")
    .eq("waitlist_id", waitlistId);

  const softCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const bouncedSet = new Set(
    (bouncedRows ?? [])
      .filter(
        (row) =>
          row.bounce_type === "hard" ||
          new Date(row.created_at).getTime() > softCutoff
      )
      .map((row) => row.email)
  );

  const eligible = (subscribers ?? []).filter(
    (s) => !s.unsubscribed_at && !bouncedSet.has(s.email)
  );

  const all = eligible.length;
  const hot_warm = eligible.filter(
    (s) => s.warmth_score === "hot" || s.warmth_score === "warm"
  ).length;
  const cold = eligible.filter((s) => s.warmth_score === "cold").length;

  // AC4: shape unchanged — broadcast client reads exactly these keys.
  return NextResponse.json({ all, hot_warm, cold });
}
