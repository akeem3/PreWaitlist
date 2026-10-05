import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RESERVED_WORDS = [
  "api",
  "www",
  "app",
  "admin",
  "dashboard",
  "onboarding",
  "signin",
  "signup",
  "verify-email",
];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug parameter" },
      { status: 400 }
    );
  }

  if (RESERVED_WORDS.includes(slug.toLowerCase())) {
    return NextResponse.json({ available: false });
  }

  const { data, error } = await supabase
    .from("waitlists")
    .select("id")
    .eq("subdomain", slug)
    .maybeSingle();

  if (error) {
    console.error("[API check-slug] lookup failed:", error.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ available: !data });
}
