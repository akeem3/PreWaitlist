import { NextResponse } from "next/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import { createClient } from "@/lib/supabase/server";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("paddle_customer_id, paddle_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.paddle_customer_id || !profile?.paddle_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }

  // Story 19.4 M32: the SDK call was unguarded — a Paddle failure would
  // surface as a default Next 500 page instead of a JSON error the modal
  // can display.
  let session: Awaited<ReturnType<Paddle["customerPortalSessions"]["create"]>>;
  try {
    session = await paddle.customerPortalSessions.create(
      profile.paddle_customer_id,
      [profile.paddle_subscription_id]
    );
  } catch (err) {
    console.error("[API POST /billing/portal] portal session failed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.urls.general.overview });
}
