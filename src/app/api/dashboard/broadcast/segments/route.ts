import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
  }

  const [allResult, hotWarmResult, coldResult] = await Promise.all([
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .in("warmth_score", ["hot", "warm"]),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .eq("warmth_score", "cold"),
  ]);

  return NextResponse.json({
    all: allResult.count ?? 0,
    hot_warm: hotWarmResult.count ?? 0,
    cold: coldResult.count ?? 0,
  });
}
