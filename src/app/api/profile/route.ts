import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("founder_profiles")
    .select("display_name, avatar_url, bio, tier, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({
    displayName: profile.display_name || "",
    avatarUrl: profile.avatar_url || "",
    bio: profile.bio || "",
    tier: profile.tier || "free",
    email: user.email || "",
    createdAt: profile.created_at,
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

  return NextResponse.json({ success: true });
}
