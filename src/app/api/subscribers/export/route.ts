import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

// RFC 4180: fields containing commas, double quotes, or line breaks must be
// enclosed in double quotes; embedded double quotes are doubled.
// OWASP WSTG-INPV-21 (19.2 founder decision 2026-10-04): a cell beginning
// with =, +, -, @ (or tab/CR) is executed as a formula by spreadsheet apps —
// subscriber-controlled free text (qual answers, names) is the vector. Prefix
// an apostrophe to force text. Pure numerics (e.g. E.164 phones like
// +15551234567) are exempt: they evaluate as numbers, never as commands.
const FORMULA_LEAD = /^[=+\-@\t\r]/;
const PURE_NUMBER = /^[+-]?\d+(?:\.\d+)?$/;

function escapeCsvCell(value: string): string {
  const safe =
    FORMULA_LEAD.test(value) && !PURE_NUMBER.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
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

  let wlQuery = supabase.from("waitlists").select("id, subdomain, phone_mode");
  if (wid) {
    wlQuery = wlQuery.eq("id", wid).eq("founder_id", user.id);
  } else {
    wlQuery = wlQuery.eq("founder_id", user.id);
  }
  const { data: waitlist } = await wlQuery.maybeSingle();
  if (!waitlist) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  const phoneEnabled =
    ((waitlist as { phone_mode?: string | null }).phone_mode ?? "off") !==
    "off";

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

  // Full-literal selects per branch — supabase's type parser rejects
  // conditional template-literal column strings (build-time ParserError).
  const subscribersResult = phoneEnabled
    ? await supabase
        .from("subscribers")
        .select(
          "id, email, display_name, created_at, warmth_score, qual_answers, phone"
        )
        .eq("waitlist_id", waitlist.id)
        .order("created_at", { ascending: true })
    : await supabase
        .from("subscribers")
        .select(
          "id, email, display_name, created_at, warmth_score, qual_answers"
        )
        .eq("waitlist_id", waitlist.id)
        .order("created_at", { ascending: true });

  type ExportSub = {
    id: string;
    email: string;
    display_name: string | null;
    created_at: string;
    warmth_score: string | null;
    qual_answers: unknown;
    phone?: string | null;
  };
  const subscribers = subscribersResult.data as ExportSub[] | null;

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

  // 19.2 AC1 + AC4: Quality sits adjacent to Warmth (order locked by AC6
  // tests). AC2 amended 2026-10-04 (founder): Quality = referral-quality %
  // matching the dashboard formula (leaderboard/page.tsx) — computed from the
  // referralCounts map already fetched above, so still zero new queries.
  const totalReferrals = subscribers.reduce(
    (sum, s) => sum + (referralCounts.get(s.id) || 0),
    0
  );

  const headerCells = [
    "Email",
    "Name",
    ...(phoneEnabled ? ["Phone"] : []),
    "Position",
    "Referrals",
    "Warmth",
    "Quality",
    "Signup Date",
    ...questions.map((q) => q.question_text),
  ];
  const header = headerCells.map(escapeCsvCell).join(",");

  const csvRows = subscribers.map((s, i) => {
    const referrals = referralCounts.get(s.id) || 0;
    const quality =
      totalReferrals > 0
        ? `${Math.round((referrals / totalReferrals) * 100)}%`
        : "";
    const date = new Date(s.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const answers = s.qual_answers as Record<string, unknown> | null;
    const cells = [
      s.email,
      s.display_name || "",
      ...(phoneEnabled ? [s.phone || ""] : []),
      String(i + 1),
      String(referrals),
      s.warmth_score || "",
      quality,
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
