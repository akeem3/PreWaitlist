import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isReservedSubdomain, isValidSubdomain } from "@/lib/subdomain";

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

  if (!isValidSubdomain(slug)) {
    return NextResponse.json(
      { error: "Invalid subdomain format" },
      { status: 400 }
    );
  }

  if (isReservedSubdomain(slug)) {
    return NextResponse.json({ available: false, reason: "reserved" });
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
