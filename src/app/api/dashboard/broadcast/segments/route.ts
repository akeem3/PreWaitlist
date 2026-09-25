import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/tier-gating";

// Bound the not-in list so the encoded query string stays within proxy
// header limits. Above this, counts fall back to unsub-only filtering
// (documented in the story's Implementation Status).
const BOUNCE_FILTER_MAX = 200;

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

  // AC1: accept the active waitlist id (client sends `wid`; `waitlist_id`
  // also accepted).
  const { searchParams } = new URL(request.url);
  const wid = searchParams.get("wid") ?? searchParams.get("waitlist_id");

  // AC2: always founder-scoped, narrowed by the provided id. .maybeSingle()
  // returns null instead of erroring — multi-waitlist founders with an id
  // are handled, and a non-owned id falls through to 404.
  let waitlistQuery = supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id);

  if (wid) {
    waitlistQuery = waitlistQuery.eq("id", wid);
  }

  const { data: waitlist } = await waitlistQuery.maybeSingle();

  if (!waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
  }

  // AC4: counts should approximate send-time eligible recipients. Mirror
  // isEmailBounced() semantics: hard bounces suppress forever, soft bounces
  // only within 24h (older soft rows linger until the send path lazily
  // deletes them).
  const { data: bouncedRows } = await supabase
    .from("bounced_emails")
    .select("email, bounce_type, created_at")
    .eq("waitlist_id", waitlist.id);

  const softCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const activeBounced = [
    ...new Set(
      (bouncedRows ?? [])
        .filter(
          (row) =>
            row.bounce_type === "hard" ||
            new Date(row.created_at).getTime() > softCutoff
        )
        .map((row) => row.email)
    ),
  ];
  const excludeBounced =
    activeBounced.length > 0 && activeBounced.length <= BOUNCE_FILTER_MAX;

  const eligibleCount = () => {
    let query = supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .is("unsubscribed_at", null);

    if (excludeBounced) {
      query = query.not("email", "in", `(${activeBounced.join(",")})`);
    }

    return query;
  };

  const [allResult, hotWarmResult, coldResult] = await Promise.all([
    eligibleCount(),
    eligibleCount().in("warmth_score", ["hot", "warm"]),
    eligibleCount().eq("warmth_score", "cold"),
  ]);

  // AC5: shape unchanged — broadcast client reads exactly these keys.
  return NextResponse.json({
    all: allResult.count ?? 0,
    hot_warm: hotWarmResult.count ?? 0,
    cold: coldResult.count ?? 0,
  });
}
