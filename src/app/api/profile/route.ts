import { NextResponse, type NextRequest } from "next/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getPaddle(): Paddle | null {
  return process.env.PADDLE_API_KEY
    ? new Paddle(process.env.PADDLE_API_KEY)
    : null;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  type ProfileRow = {
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    tier?: string | null;
    created_at?: string | null;
  };

  let profile: ProfileRow | null = null;

  const fullSelect = await supabase
    .from("founder_profiles")
    .select("display_name, avatar_url, bio, tier, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (fullSelect.error) {
    const msg = fullSelect.error.message || "";
    const missingProfileColumns =
      fullSelect.error.code === "42703" ||
      fullSelect.error.code === "PGRST204" ||
      msg.includes("display_name") ||
      msg.includes("avatar_url") ||
      msg.includes("bio");

    if (!missingProfileColumns) {
      return NextResponse.json(
        { error: fullSelect.error.message },
        { status: 400 }
      );
    }

    // Profile-settings columns not migrated yet — still return tier so billing/gating work
    const coreSelect = await supabase
      .from("founder_profiles")
      .select("tier, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (coreSelect.error) {
      return NextResponse.json(
        { error: coreSelect.error.message },
        { status: 400 }
      );
    }
    profile = coreSelect.data;
  } else {
    profile = fullSelect.data;
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("business_address")
    .eq("founder_id", user.id)
    .limit(1)
    .maybeSingle();

  const providers =
    user.identities?.map((i) => i.provider) ??
    (typeof user.app_metadata?.provider === "string"
      ? [user.app_metadata.provider]
      : []);

  return NextResponse.json({
    displayName: profile?.display_name || "",
    avatarUrl: profile?.avatar_url || "",
    bio: profile?.bio || "",
    tier: profile?.tier || "free",
    email: user.email || "",
    createdAt: profile?.created_at ?? null,
    businessAddress: waitlist?.business_address || "",
    hasPassword: providers.includes("email"),
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, string> = {};

  if (typeof body.display_name === "string") {
    if (body.display_name.length > 100) {
      return NextResponse.json(
        { error: "Display name must be 100 characters or fewer" },
        { status: 400 }
      );
    }
    updates.display_name = body.display_name.trim();
  }

  if (typeof body.avatar_url === "string") {
    if (body.avatar_url.length > 500) {
      return NextResponse.json(
        { error: "Avatar URL must be 500 characters or fewer" },
        { status: 400 }
      );
    }
    updates.avatar_url = body.avatar_url.trim();
  }

  if (typeof body.bio === "string") {
    if (body.bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or fewer" },
        { status: 400 }
      );
    }
    updates.bio = body.bio.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("founder_profiles")
    .update(updates)
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (typeof body.business_address === "string") {
    await supabase
      .from("waitlists")
      .update({ business_address: body.business_address.trim() })
      .eq("founder_id", user.id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Cancel active Paddle subscription first so deletion never leaves billing running
  const { data: profile } = await admin
    .from("founder_profiles")
    .select("paddle_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  const subscriptionId = profile?.paddle_subscription_id as string | null;
  const paddle = getPaddle();
  if (subscriptionId && paddle) {
    try {
      await paddle.subscriptions.cancel(subscriptionId, {
        effectiveFrom: "immediately",
      });
    } catch (err) {
      console.error("Failed to cancel Paddle subscription on delete", err);
      return NextResponse.json(
        {
          error:
            "Could not cancel your subscription. Cancel it from Billing, then try again.",
        },
        { status: 409 }
      );
    }
  }

  // Single delete — FK cascade: auth.users → founder_profiles → waitlists →
  // subscribers, qualification_questions, milestone_rewards, founder_updates,
  // email_events, page_views, bounced_emails
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete account: " + deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
