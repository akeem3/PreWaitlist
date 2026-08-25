import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anonymizeEmail } from "@/lib/format";

type Props = { params: Promise<{ subdomain: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { subdomain } = await params;

  if (!subdomain) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = await createClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("subdomain", subdomain)
    .single();

  if (!waitlist) {
    return NextResponse.json([], { status: 200 });
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email, position, referral_code, qual_answers, created_at")
    .eq("waitlist_id", waitlist.id)
    .order("created_at", { ascending: true });

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const subscriberIds = subscribers.map((s) => s.id);
  const { data: referralRows } = await supabase
    .from("subscribers")
    .select("referrer_id")
    .in("referrer_id", subscriberIds);

  const countMap = new Map<string, number>();
  referralRows?.forEach((r) => {
    countMap.set(r.referrer_id, (countMap.get(r.referrer_id) || 0) + 1);
  });

  const ranked = subscribers
    .map((s) => ({
      position: s.position,
      email: anonymizeEmail(s.email),
      referral_code: s.referral_code,
      referral_count: countMap.get(s.id) || 0,
      qual_answers: s.qual_answers,
    }))
    .sort((a, b) => {
      if (b.referral_count !== a.referral_count)
        return b.referral_count - a.referral_count;
      return a.position - b.position;
    });

  return NextResponse.json(ranked, { status: 200 });
}
