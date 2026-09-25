import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // View-only: free tier sees warmth numbers on dashboard cards (decision 2026-09-22).
  // Pro tier gates the Full Warmth page and segment targeting, not this summary.

  // AC5: head counts instead of loading every warmth_score row into JS.
  // Supabase builders are thenable/single-use — one fresh chain per count.
  const countBuilder = (score?: "hot" | "warm" | "cold") => {
    const query = supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id);
    return score ? query.eq("warmth_score", score) : query;
  };

  const [totalResult, hotResult, warmResult, coldResult] = await Promise.all([
    countBuilder(),
    countBuilder("hot"),
    countBuilder("warm"),
    countBuilder("cold"),
  ]);

  const total = totalResult.count ?? 0;
  const hot = hotResult.count ?? 0;
  const warm = warmResult.count ?? 0;
  const cold = coldResult.count ?? 0;

  const response = NextResponse.json({
    hot,
    warm,
    cold,
    total,
  });
  response.headers.set(
    "Cache-Control",
    "s-maxage=30, stale-while-revalidate=60"
  );
  return response;
}
