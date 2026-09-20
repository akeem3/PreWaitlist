import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/tier-gating";

export async function GET() {
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
    .select("tier")
    .eq("id", user.id)
    .single();

  const tierCheck = requirePro(
    profile?.tier ?? "free",
    "Domain authentication"
  );
  if (!tierCheck.allowed) {
    return NextResponse.json({ error: tierCheck.reason }, { status: 403 });
  }

  return NextResponse.json({
    verified: false,
    message: "Verification will be available in a future update",
  });
}
