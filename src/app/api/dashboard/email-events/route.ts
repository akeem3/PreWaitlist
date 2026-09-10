import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subscriberId = searchParams.get("subscriber_id");

  if (!subscriberId) {
    return NextResponse.json(
      { error: "subscriber_id is required" },
      { status: 400 }
    );
  }

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("id, waitlists!inner ( founder_id )")
    .eq("id", subscriberId)
    .single();

  if (
    !subscriber ||
    (subscriber.waitlists as unknown as { founder_id: string }).founder_id !==
      user.id
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: events, error } = await supabase
    .from("email_events")
    .select("id, event_type, event_data, created_at")
    .eq("subscriber_id", subscriberId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events || [] });
}
