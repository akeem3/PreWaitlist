import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, sending_domain, resend_domain_id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist?.resend_domain_id) {
    return NextResponse.json({ registered: false });
  }

  try {
    const result = await resend.domains.get(waitlist.resend_domain_id);

    if (result.error) {
      return NextResponse.json({ registered: false });
    }

    const domainData = result.data;

    // If verified, ensure sending_domain is set
    if (domainData.status === "verified" && !waitlist.sending_domain) {
      await supabase
        .from("waitlists")
        .update({ sending_domain: domainData.name })
        .eq("id", waitlist.id);
    }

    return NextResponse.json({
      registered: true,
      id: domainData.id,
      name: domainData.name,
      status: domainData.status,
      records: domainData.records,
    });
  } catch {
    return NextResponse.json({ registered: false });
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, resend_domain_id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist?.resend_domain_id) {
    return NextResponse.json({ error: "No domain to remove" }, { status: 400 });
  }

  try {
    await resend.domains.remove(waitlist.resend_domain_id);
  } catch {
    // Best effort removal
  }

  await supabase
    .from("waitlists")
    .update({ resend_domain_id: null, sending_domain: null })
    .eq("id", waitlist.id);

  return NextResponse.json({ ok: true });
}
