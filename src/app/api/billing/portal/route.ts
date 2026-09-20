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
    .single();

  if (!profile?.paddle_customer_id || !profile?.paddle_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }

  const session = await paddle.customerPortalSessions.create(
    profile.paddle_customer_id,
    [profile.paddle_subscription_id]
  );

  return NextResponse.json({ url: session.urls.general.overview });
}
