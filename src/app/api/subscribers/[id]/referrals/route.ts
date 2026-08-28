import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, waitlists!inner ( founder_id )")
    .eq("id", id)
    .single();

  if (!subscriber) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const waitlist = subscriber.waitlists as unknown as { founder_id: string };
  if (waitlist.founder_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", id);

  const { data: referrals } = await supabase
    .from("subscribers")
    .select("id, email, position, created_at")
    .eq("referrer_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    referral_count: count || 0,
    referrals: referrals || [],
  });
}
