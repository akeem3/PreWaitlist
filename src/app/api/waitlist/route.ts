import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Ensure founder_profiles exists (required FK for waitlists table)
  const { data: profile, error: profileError } = await supabase
    .from("founder_profiles")
    .select("id, tier")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Auto-create founder_profile if it doesn't exist
    const { error: insertProfileError } = await supabase
      .from("founder_profiles")
      .insert({ id: user.id });

    if (insertProfileError) {
      console.error("Failed to create founder profile:", insertProfileError);
      return NextResponse.json(
        {
          error: `Failed to create founder profile: ${insertProfileError.message}`,
        },
        { status: 400 }
      );
    }
  }

  const tier = profile?.tier || "free";

  // Tier enforcement: free = max 1 waitlist, Pro = unlimited
  const { count } = await supabase
    .from("waitlists")
    .select("id", { count: "exact", head: true })
    .eq("founder_id", user.id);

  if (tier === "free" && (count ?? 0) >= 1) {
    return NextResponse.json(
      { error: "Upgrade to Pro to create more waitlists" },
      { status: 402 }
    );
  }

  // Always insert a new waitlist row (no upsert)
  const insertPayload: Record<string, unknown> = {
    founder_id: user.id,
    subdomain: body.subdomain,
    headline: body.headline ?? null,
    subheadline: body.subheadline ?? null,
    product_name: body.product_name ?? null,
  };
  if (body.template !== undefined) insertPayload.template = body.template;
  if (body.brand_color !== undefined)
    insertPayload.brand_color = body.brand_color;
  if (body.logo_url !== undefined) insertPayload.logo_url = body.logo_url;
  if (body.cta_text !== undefined) insertPayload.cta_text = body.cta_text;
  if (body.signup_counter_enabled !== undefined)
    insertPayload.signup_counter_enabled = body.signup_counter_enabled;
  if (body.signup_counter_threshold !== undefined)
    insertPayload.signup_counter_threshold = body.signup_counter_threshold;
  if (Array.isArray(body.milestone_rewards)) {
    insertPayload.milestone_rewards_enabled = body.milestone_rewards.length > 0;
  }

  const { data, error } = await supabase
    .from("waitlists")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create waitlist:", error);
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 400 }
    );
  }

  const waitlistId = data.id;

  // Insert milestone_rewards if provided
  if (
    Array.isArray(body.milestone_rewards) &&
    body.milestone_rewards.length > 0
  ) {
    const rewardRows = body.milestone_rewards.map(
      (r: { threshold: number; label: string }) => ({
        waitlist_id: waitlistId,
        tier_referrals: Number(r.threshold),
        reward_label: String(r.label),
      })
    );
    const { error: rewardsError } = await supabase
      .from("milestone_rewards")
      .insert(rewardRows);
    if (rewardsError) {
      console.error(
        "[API POST] Failed to insert milestone_rewards:",
        JSON.stringify(rewardsError, null, 2)
      );
    }
  }

  // Insert qualification_questions if provided
  if (Array.isArray(body.questions) && body.questions.length > 0) {
    const questionRows = body.questions.map(
      (q: { text: string; required: boolean }, index: number) => ({
        waitlist_id: waitlistId,
        question_text: q.text,
        question_type: "free_text" as const,
        sort_order: index,
      })
    );
    await supabase.from("qualification_questions").insert(questionRows);
  }

  return NextResponse.json({ id: waitlistId }, { status: 201 });
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
  const { waitlist_id, milestone_rewards, questions, ...updates } = body;

  if (!waitlist_id) {
    return NextResponse.json(
      { error: "waitlist_id is required" },
      { status: 400 }
    );
  }

  // Validate ownership
  const { data: existing } = await supabase
    .from("waitlists")
    .select("id")
    .eq("id", waitlist_id)
    .eq("founder_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  // Validate email customization fields
  if (
    typeof updates.email_subject === "string" &&
    updates.email_subject.length > 200
  ) {
    return NextResponse.json(
      { error: "Email subject must be 200 characters or fewer" },
      { status: 400 }
    );
  }
  if (
    typeof updates.email_body === "string" &&
    updates.email_body.length > 5000
  ) {
    return NextResponse.json(
      { error: "Email body must be 5000 characters or fewer" },
      { status: 400 }
    );
  }
  if (
    typeof updates.email_sender_name === "string" &&
    updates.email_sender_name.length > 100
  ) {
    return NextResponse.json(
      { error: "Sender name must be 100 characters or fewer" },
      { status: 400 }
    );
  }

  // Strip <script> tags from email content
  if (typeof updates.email_subject === "string") {
    updates.email_subject = updates.email_subject
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .trim();
  }
  if (typeof updates.email_body === "string") {
    updates.email_body = updates.email_body
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .trim();
  }

  // milestone_rewards lives in a separate table, not the waitlists table.
  // Map the array presence to the boolean column.
  if (Array.isArray(milestone_rewards)) {
    updates.milestone_rewards_enabled = milestone_rewards.length > 0;
  }

  // Explicit handling for product_name (also included via ...updates spread)
  if (body.product_name !== undefined) updates.product_name = body.product_name;

  // Update waitlists table (excluding questions — that's a child table)
  const { error } = await supabase
    .from("waitlists")
    .update(updates)
    .eq("id", waitlist_id)
    .eq("founder_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Upsert qualification_questions if provided
  if (Array.isArray(questions)) {
    // Delete existing questions for this waitlist
    await supabase
      .from("qualification_questions")
      .delete()
      .eq("waitlist_id", waitlist_id);

    // Insert new questions (all questions are free_text on public page)
    if (questions.length > 0) {
      const questionRows = questions.map(
        (q: { text: string; required: boolean }, index: number) => ({
          waitlist_id: waitlist_id,
          question_text: q.text,
          question_type: "free_text" as const,
          sort_order: index,
        })
      );

      const { error: questionsError } = await supabase
        .from("qualification_questions")
        .insert(questionRows);

      if (questionsError) {
        console.error("Failed to save questions:", questionsError);
        return NextResponse.json(
          { error: questionsError.message },
          { status: 400 }
        );
      }
    }
  }

  // Upsert milestone_rewards if provided
  if (Array.isArray(milestone_rewards)) {
    // Delete existing rewards for this waitlist
    const { error: deleteError } = await supabase
      .from("milestone_rewards")
      .delete()
      .eq("waitlist_id", waitlist_id);
    if (deleteError) {
      console.error(
        "[API PATCH] Failed to delete milestone_rewards:",
        JSON.stringify(deleteError, null, 2)
      );
    }

    // Insert new rewards
    if (milestone_rewards.length > 0) {
      const rewardRows = milestone_rewards.map(
        (r: { threshold: number; label: string }) => ({
          waitlist_id: waitlist_id,
          tier_referrals: Number(r.threshold),
          reward_label: String(r.label),
        })
      );

      const { error: rewardsError } = await supabase
        .from("milestone_rewards")
        .insert(rewardRows);

      if (rewardsError) {
        console.error(
          "[API PATCH] Failed to save milestone rewards:",
          JSON.stringify(rewardsError, null, 2)
        );
        return NextResponse.json(
          { error: rewardsError.message },
          { status: 400 }
        );
      }
    }
  }

  return NextResponse.json({ success: true });
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

  // Get all waitlists for the founder
  const { data: waitlists, error: waitlistError } = await supabase
    .from("waitlists")
    .select("*")
    .eq("founder_id", user.id)
    .order("created_at", { ascending: true });

  if (waitlistError) {
    return NextResponse.json({ error: waitlistError.message }, { status: 400 });
  }

  if (!waitlists || waitlists.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  // Fetch founder tier
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  const tier = profile?.tier ?? "free";

  // Batch-fetch subscriber counts for all waitlists
  const waitlistIds = waitlists.map((w) => w.id);
  const { data: subscriberCounts } = await supabase
    .from("subscribers")
    .select("waitlist_id", { count: "exact", head: true })
    .in("waitlist_id", waitlistIds);

  // Build a map of waitlist_id → count
  const countMap = new Map<string, number>();
  for (const id of waitlistIds) {
    countMap.set(id, 0);
  }
  if (subscriberCounts) {
    // PostgREST with head:true returns rows — count is per-query, not per-row
    // We need individual counts per waitlist
  }

  // Get individual counts per waitlist (batch)
  const countPromises = waitlistIds.map((id) =>
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("waitlist_id", id)
  );
  const countResults = await Promise.all(countPromises);
  for (let i = 0; i < waitlistIds.length; i++) {
    countMap.set(waitlistIds[i], countResults[i].count ?? 0);
  }

  // Get milestone rewards and questions for each waitlist
  const [rewardsResults, questionsResults] = await Promise.all([
    supabase
      .from("milestone_rewards")
      .select("waitlist_id, tier_referrals, reward_label")
      .in("waitlist_id", waitlistIds)
      .order("tier_referrals", { ascending: true }),
    supabase
      .from("qualification_questions")
      .select("waitlist_id, question_text, question_type, sort_order")
      .in("waitlist_id", waitlistIds)
      .order("sort_order", { ascending: true }),
  ]);

  // Group rewards and questions by waitlist_id
  const rewardsMap = new Map<string, { threshold: number; label: string }[]>();
  for (const r of rewardsResults.data || []) {
    if (!rewardsMap.has(r.waitlist_id)) rewardsMap.set(r.waitlist_id, []);
    rewardsMap.get(r.waitlist_id)!.push({
      threshold: r.tier_referrals,
      label: r.reward_label,
    });
  }

  const questionsMap = new Map<string, { text: string; required: boolean }[]>();
  for (const q of questionsResults.data || []) {
    if (!questionsMap.has(q.waitlist_id)) questionsMap.set(q.waitlist_id, []);
    questionsMap.get(q.waitlist_id)!.push({
      text: q.question_text,
      required: q.question_type === "free_text",
    });
  }

  // Map to response shape
  const result = waitlists.map((waitlist) => ({
    waitlistId: waitlist.id,
    slug: waitlist.subdomain || "",
    productName: waitlist.product_name || waitlist.headline || "",
    headline: waitlist.headline || "",
    subheadline: waitlist.subheadline || "",
    template: waitlist.template || "minimal",
    brandColor: waitlist.brand_color || "#0F7A5E",
    logoUrl: waitlist.logo_url || null,
    ctaText: waitlist.cta_text || "Join Waitlist",
    subscriberCount: countMap.get(waitlist.id) || 0,
    isArchived: waitlist.is_archived || false,
    milestoneRewards: rewardsMap.get(waitlist.id) || [],
    qualificationEnabled: waitlist.qualification_enabled || false,
    questions: questionsMap.get(waitlist.id) || [],
    signupCounterEnabled: waitlist.signup_counter_enabled || false,
    signupCounterThreshold: waitlist.signup_counter_threshold || 10,
    emailSubject: waitlist.email_subject || "",
    emailSenderName: waitlist.email_sender_name || "",
    emailBody: waitlist.email_body || "",
    tier,
  }));

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { waitlist_ids } = await request.json();

  if (!Array.isArray(waitlist_ids) || waitlist_ids.length === 0) {
    return NextResponse.json(
      { error: "waitlist_ids array required" },
      { status: 400 }
    );
  }

  // Verify ownership before deleting
  const { data: owned, error: lookupError } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .in("id", waitlist_ids);

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 });
  }

  const ownedIds = (owned || []).map((w) => w.id);

  if (ownedIds.length === 0) {
    return NextResponse.json(
      { error: "No waitlists found to delete" },
      { status: 404 }
    );
  }

  // Delete — ON DELETE CASCADE handles all child tables
  const { error: deleteError } = await supabase
    .from("waitlists")
    .delete()
    .in("id", ownedIds);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: ownedIds.length, ids: ownedIds });
}
