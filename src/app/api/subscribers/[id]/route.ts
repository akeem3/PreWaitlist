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
    .select(
      "id, email, position, referral_code, qual_answers, created_at, waitlist_id"
    )
    .eq("id", id)
    .single();

  if (!subscriber) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("founder_id")
    .eq("id", subscriber.waitlist_id)
    .single();

  if (!waitlist || waitlist.founder_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", id);

  return NextResponse.json(
    {
      id: subscriber.id,
      email: subscriber.email,
      position: subscriber.position,
      referral_code: subscriber.referral_code,
      referral_count: count || 0,
      qual_answers: subscriber.qual_answers,
      created_at: subscriber.created_at,
    },
    { status: 200 }
  );
}
