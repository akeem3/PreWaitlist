import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/tier-gating";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, resend_domain_id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
  }

  if (waitlist.resend_domain_id) {
    return NextResponse.json(
      { error: "A domain is already registered. Remove it first." },
      { status: 409 }
    );
  }

  const body = await request.json();
  const domain = body.domain?.trim();

  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  try {
    const result = await resend.domains.create({ name: domain });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    const domainData = result.data;

    await supabase
      .from("waitlists")
      .update({ resend_domain_id: domainData.id })
      .eq("id", waitlist.id);

    return NextResponse.json({
      registered: true,
      id: domainData.id,
      name: domainData.name,
      status: domainData.status,
      records: domainData.records,
    });
  } catch (err) {
    console.error("[domains] create failed:", err);
    return NextResponse.json(
      { error: "Failed to create domain" },
      { status: 500 }
    );
  }
}

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
