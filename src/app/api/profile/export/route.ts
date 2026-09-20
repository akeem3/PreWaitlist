import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anonymizeEmail } from "@/lib/format";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Phase 1: profile + waitlists (need waitlist IDs for phase 2)
  const [profileResult, waitlistsResult] = await Promise.all([
    supabase
      .from("founder_profiles")
      .select("display_name, avatar_url, bio, tier, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("waitlists")
      .select("id, subdomain, headline, subheadline, template, created_at")
      .eq("founder_id", user.id),
  ]);

  const waitlistIds = (waitlistsResult.data || []).map((w) => w.id);

  // Phase 2: subscribers + updates (depend on waitlist IDs)
  const [subscribersResult, updatesResult] = await Promise.all([
    waitlistIds.length > 0
      ? supabase
          .from("subscribers")
          .select("id, email, position, referral_code, created_at")
          .in("waitlist_id", waitlistIds)
      : Promise.resolve({ data: [] }),
    waitlistIds.length > 0
      ? supabase
          .from("founder_updates")
          .select("id, body, created_at")
          .in("waitlist_id", waitlistIds)
      : Promise.resolve({ data: [] }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      displayName: profileResult.data?.display_name || "",
      email: user.email || "",
      tier: profileResult.data?.tier || "free",
      createdAt: profileResult.data?.created_at || "",
    },
    waitlists: (waitlistsResult.data || []).map((w) => ({
      subdomain: w.subdomain,
      headline: w.headline,
      subheadline: w.subheadline,
      template: w.template,
      createdAt: w.created_at,
    })),
    subscribers: (subscribersResult.data || []).map((s) => ({
      email: anonymizeEmail(s.email),
      position: s.position,
      referralCode: s.referral_code,
      createdAt: s.created_at,
    })),
    updates: (updatesResult.data || []).map((u) => ({
      body: u.body,
      createdAt: u.created_at,
    })),
  };

  return NextResponse.json(exportData, {
    headers: {
      "Content-Disposition": `attachment; filename="prewaitlist-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
