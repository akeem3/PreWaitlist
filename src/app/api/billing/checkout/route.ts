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
    .maybeSingle();

  if (!profile) {
    // Pay-before-onboarding: fresh signups reach checkout from onboarding/1
    // before any waitlist exists, and founder_profiles is otherwise created
    // lazily at waitlist creation (api/waitlist/route.ts). Create it here so
    // checkout never 404s. Same pattern + insert policy as that route.
    const { error: insertProfileError } = await supabase
      .from("founder_profiles")
      .insert({ id: user.id });

    if (insertProfileError) {
      // Concurrent-create race (double-click): another request may have
      // inserted the row first — proceed if it now exists.
      const { data: retried } = await supabase
        .from("founder_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!retried) {
        console.error(
          "[API POST /billing/checkout] founder_profile create failed:",
          insertProfileError.message
        );
        return NextResponse.json(
          { error: "Something went wrong. Please try again." },
          { status: 500 }
        );
      }
    }
  }

  if (profile?.tier === "pro") {
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
