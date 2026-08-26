import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

const MAX_BODY_LENGTH = 2000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const text = (body?.body ?? "").trim();

  if (!text) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  if (text.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Body must be under ${MAX_BODY_LENGTH} characters` },
      { status: 400 }
    );
  }

  const { data: waitlist, error: waitlistError } = await supabase
    .from("waitlists")
    .select("id, subdomain, name")
    .eq("founder_id", user.id)
    .single();

  if (waitlistError || !waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 400 });
  }

  const { data: update, error: insertError } = await supabase
    .from("founder_updates")
    .insert({
      waitlist_id: waitlist.id,
      body: text,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      },
      { status: 400 }
    );
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("id, email")
    .eq("waitlist_id", waitlist.id);

  if (subscribers && subscribers.length > 0) {
    const BATCH_SIZE = 100;
    const batchEmails = [];

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const emails = batch.map((sub) => ({
        from: `${waitlist.name || waitlist.subdomain} <updates@prewaitlist.com>`,
        to: sub.email,
        subject: `Update from ${waitlist.name || waitlist.subdomain}`,
        text: text,
      }));
      batchEmails.push(...emails);
    }

    try {
      await resend.batch.send(batchEmails);

      await supabase
        .from("founder_updates")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", update.id);
    } catch {
      console.error("Failed to send update emails");
    }
  }

  return NextResponse.json({ id: update.id }, { status: 201 });
}
