import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PRO_PRICE_ID = process.env.PADDLE_PRO_PRICE_ID ?? "";

export async function POST(req: Request) {
  if (!PRO_PRICE_ID) {
    return NextResponse.json(
      { error: "PADDLE_PRO_PRICE_ID is not configured" },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("id, tier")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.tier === "pro") {
    return NextResponse.json(
      { error: "Already subscribed to Pro" },
      { status: 400 }
    );
  }

  const { triggerSource } = await req.json().catch(() => ({}));

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    priceId: PRO_PRICE_ID,
    customData: {
      user_id: user.id,
      waitlist_id: waitlist?.id ?? null,
      trigger_source: triggerSource ?? "unknown",
    },
  });
}
