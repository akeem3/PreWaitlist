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

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await request.json();
  const { display_name, referral_code } = body;

  if (!referral_code) {
    return NextResponse.json(
      { error: "referral_code is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Validate subscriber owns this record via referral_code
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, referral_code")
    .eq("id", id)
    .eq("referral_code", referral_code)
    .single();

  if (!subscriber) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const trimmed = typeof display_name === "string" ? display_name.trim() : null;

  let { error } = await supabase
    .from("subscribers")
    .update({ display_name: trimmed || null })
    .eq("id", id);

  // If column doesn't exist yet, silently succeed (migration pending)
  if (error?.code === "PGRST204" && error?.message?.includes("display_name")) {
    error = null;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
