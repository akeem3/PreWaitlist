import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateReferralCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const body = await request.json();
  const { waitlist_id, email, referrer_id, qual_answers } = body;

  if (!waitlist_id || !email) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  const { data: maxPos } = await supabase
    .from("subscribers")
    .select("position")
    .eq("waitlist_id", waitlist_id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (maxPos?.position ?? 0) + 1;
  const referral_code = generateReferralCode();

  const { data, error } = await supabase
    .from("subscribers")
    .insert({
      waitlist_id,
      email: trimmedEmail,
      referral_code,
      position,
      referrer_id: referrer_id || null,
      qual_answers:
        qual_answers && Object.keys(qual_answers).length > 0
          ? qual_answers
          : null,
    })
    .select("id, email, referral_code, position")
    .single();

  if (error) {
    if (
      error.code === "23505" &&
      error.message.includes("subscribers_waitlist_email_idx")
    ) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 409 }
      );
    }
    console.error("Subscriber creation error:", error);
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      id: data.id,
      email: data.email,
      referral_code: data.referral_code,
      position: data.position,
    },
    { status: 201 }
  );
}
