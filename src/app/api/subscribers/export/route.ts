import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const wid = searchParams.get("wid");

  let wlQuery = supabase.from("waitlists").select("id");
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.maybeSingle();
  if (!waitlist) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, display_name, created_at, warmth_score")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  if (!subscribers || subscribers.length === 0) {
    return new NextResponse("No subscribers to export", {
      status: 200,
      headers: { "Content-Type": "text/csv" },
    });
  }

  // Batch referral counts
  const ids = subscribers.map((s) => s.id);
  const referralCounts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: refRows } = await supabase
      .from("subscribers")
      .select("referrer_id")
      .in("referrer_id", ids);
    refRows?.forEach((r) => {
      if (r.referrer_id) {
        referralCounts.set(
          r.referrer_id,
          (referralCounts.get(r.referrer_id) || 0) + 1
        );
      }
    });
  }

  const header = "Email,Name,Position,Referrals,Warmth,Signup Date";
  const csvRows = subscribers.map((s, i) => {
    const referrals = referralCounts.get(s.id) || 0;
    const date = new Date(s.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const email = s.email.includes(",") ? `"${s.email}"` : s.email;
    const name = s.display_name
      ? s.display_name.includes(",")
        ? `"${s.display_name}"`
        : s.display_name
      : "";
    return `${email},${name},${i + 1},${referrals},${s.warmth_score || ""},${date}`;
  });

  const csv = [header, ...csvRows].join("\n");
  const waitlistName =
    (waitlist as { subdomain?: string }).subdomain || "waitlist";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${waitlistName}-subscribers.csv"`,
    },
  });
}
