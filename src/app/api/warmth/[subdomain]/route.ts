import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = { params: Promise<{ subdomain: string }> };

export async function GET(_request: NextRequest, { params }: Props) {
  const { subdomain } = await params;
  const supabase = await createClient();
  // 14.0 AC8: no public SELECT on subscribers — admin path, explicit columns only
  const admin = createAdminClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("subdomain", subdomain)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  const { data: subscribers } = await admin
    .from("subscribers")
    .select("warmth_score")
    .eq("waitlist_id", waitlist.id);

  const scores = subscribers || [];
  const hot = scores.filter((s) => s.warmth_score === "hot").length;
  const warm = scores.filter((s) => s.warmth_score === "warm").length;
  const cold = scores.filter((s) => s.warmth_score === "cold").length;
  const unscored = scores.filter((s) => !s.warmth_score).length;

  return NextResponse.json({
    hot,
    warm,
    cold,
    unscored,
    total: scores.length,
  });
}
