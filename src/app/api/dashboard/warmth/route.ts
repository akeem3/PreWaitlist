import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/tier-gating";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const waitlistId = searchParams.get("waitlist_id");
  if (!waitlistId) {
    return NextResponse.json(
      { error: "waitlist_id is required" },
      { status: 400 }
    );
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, founder_id")
    .eq("id", waitlistId)
    .single();

  if (!waitlist || waitlist.founder_id !== user.id) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  const tierCheck = requirePro(profile?.tier ?? "free", "Warmth");
  if (!tierCheck.allowed) {
    return NextResponse.json({ error: tierCheck.reason }, { status: 403 });
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("warmth_score")
    .eq("waitlist_id", waitlist.id);

  const scores = subscribers || [];
  const hot = scores.filter((s) => s.warmth_score === "hot").length;
  const warm = scores.filter((s) => s.warmth_score === "warm").length;
  const cold = scores.filter((s) => s.warmth_score === "cold").length;
  const unscored = scores.filter((s) => !s.warmth_score).length;

  const response = NextResponse.json({
    hot,
    warm,
    cold,
    unscored,
    total: scores.length,
  });
  response.headers.set(
    "Cache-Control",
    "s-maxage=30, stale-while-revalidate=60"
  );
  return response;
}
