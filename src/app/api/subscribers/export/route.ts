import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

// RFC 4180: fields containing commas, double quotes, or line breaks must be
// enclosed in double quotes; embedded double quotes are doubled.
function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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

  let wlQuery = supabase.from("waitlists").select("id, subdomain");
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.maybeSingle();
  if (!waitlist) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  // 14.4 AC1: configured questions become one CSV column each
  const { data: questionsData } = await supabase
    .from("qualification_questions")
    .select("id, question_text, sort_order")
    .eq("waitlist_id", waitlist.id)
    .order("sort_order", { ascending: true });
  const questions = (questionsData || []) as {
    id: string;
    question_text: string;
  }[];

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, display_name, created_at, warmth_score, qual_answers")
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

  const headerCells = [
    "Email",
    "Name",
    "Position",
    "Referrals",
    "Warmth",
    "Signup Date",
    ...questions.map((q) => q.question_text),
  ];
  const header = headerCells.map(escapeCsvCell).join(",");

  const csvRows = subscribers.map((s, i) => {
    const referrals = referralCounts.get(s.id) || 0;
    const date = new Date(s.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const answers = s.qual_answers as Record<string, unknown> | null;
    const cells = [
      s.email,
      s.display_name || "",
      String(i + 1),
      String(referrals),
      s.warmth_score || "",
      date,
      ...questions.map((q) => {
        const value = answers?.[q.id];
        return typeof value === "string" ? value : "";
      }),
    ];
    return cells.map(escapeCsvCell).join(",");
  });

  const csv = [header, ...csvRows].join("\n");
  const waitlistName = waitlist.subdomain || "waitlist";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${waitlistName}-subscribers.csv"`,
    },
  });
}
