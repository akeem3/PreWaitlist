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
    scheduled_change?: { action: string; effective_at: string } | null;
    paddle_subscription_status?: string | null;
    paddle_next_billed_at?: string | null;
  };

  let profile: ProfileRow | null = null;

  const fullSelect = await supabase
    .from("founder_profiles")
    .select(
      "display_name, avatar_url, bio, tier, created_at, scheduled_change, paddle_subscription_status, paddle_next_billed_at"
    )
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
      console.error(
        "[API GET /profile] select failed:",
        fullSelect.error.message
      );
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // Profile-settings columns not migrated yet — still return tier so billing/gating work
    const coreSelect = await supabase
      .from("founder_profiles")
      .select("tier, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (coreSelect.error) {
      console.error(
        "[API GET /profile] core select failed:",
        coreSelect.error.message
      );
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
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

  // Active lists only — archived (surplus auto-archive on downgrade) must not
  // inflate the over-cap banner. Requires the is_archived backfill
  // (revenue-phase2-is-archived-backfill.sql) so legacy NULL rows count.
  const { count: waitlistCount } = await supabase
    .from("waitlists")
    .select("id", { count: "exact", head: true })
    .eq("founder_id", user.id)
    .eq("is_archived", false);

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
    scheduledChange: profile?.scheduled_change ?? null,
    subscriptionStatus: profile?.paddle_subscription_status ?? null,
    nextBilledAt: profile?.paddle_next_billed_at ?? null,
    waitlistCount: waitlistCount ?? 0,
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

  const body = await request.json().catch(() => ({}));
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
    console.error("[API PATCH /profile] update failed:", updateError.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  if (typeof body.business_address === "string") {
    // Story 19.4 H4: the address write result was ignored — a failure would
    // still return success:true and silently drop the CAN-SPAM address.
    const { error: addressError } = await supabase
      .from("waitlists")
      .update({ business_address: body.business_address.trim() })
      .eq("founder_id", user.id);
    if (addressError) {
      console.error(
        "[API PATCH /profile] business_address update failed:",
        addressError.message
      );
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
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

  // Cancel active Paddle subscription first so deletion never leaves billing running.
  // Story 19.4 M8: a failed read here must abort before deleteUser — proceeding
  // with null would delete the account while billing keeps running.
  const { data: profile, error: profileReadError } = await admin
    .from("founder_profiles")
    .select("paddle_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    console.error(
      "[API DELETE /profile] subscription lookup failed:",
      profileReadError.message
    );
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

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
    console.error(
      "[API DELETE /profile] deleteUser failed:",
      deleteError.message
    );
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
