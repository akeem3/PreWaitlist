import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_BODY_LENGTH = 2000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const text = (body?.body ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Body must be under ${MAX_BODY_LENGTH} characters` },
      { status: 400 }
    );
  }

  const { data: waitlist, error: waitlistError } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  if (waitlistError || !waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("founder_updates")
    .insert({
      waitlist_id: waitlist.id,
      body: text,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
