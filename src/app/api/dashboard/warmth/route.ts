import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
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
