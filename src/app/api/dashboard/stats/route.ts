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
    .select("id")
    .eq("id", waitlistId)
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "No waitlist" }, { status: 404 });
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(
    startOfToday.getTime() - 24 * 60 * 60 * 1000
  );
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    { count: currentTotal },
    { count: currentReferrals },
    { count: currentToday },
    { count: currentYesterday },
    { count: previousTotal },
    { count: previousReferrals },
  ] = await Promise.all([
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .not("referrer_id", "is", null)
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .gte("created_at", startOfYesterday.toISOString())
      .lt("created_at", startOfToday.toISOString()),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .lt("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", waitlist.id)
      .not("referrer_id", "is", null)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .lt("created_at", sevenDaysAgo.toISOString()),
  ]);

  return NextResponse.json({
    current: {
      total: currentTotal ?? 0,
      referrals: currentReferrals ?? 0,
      today: currentToday ?? 0,
      yesterday: currentYesterday ?? 0,
    },
    previous: {
      total: previousTotal ?? 0,
      referrals: previousReferrals ?? 0,
    },
  });
}
