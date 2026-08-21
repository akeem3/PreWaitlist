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
    .select("id")
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

  // Check if founder already has a waitlist
  const { data: existing } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .maybeSingle();

  if (existing) {
    // Update existing waitlist with new values
    const updatePayload: Record<string, unknown> = {
      subdomain: body.subdomain,
      headline: body.headline ?? null,
      subheadline: body.subheadline ?? null,
    };
    if (body.template !== undefined) updatePayload.template = body.template;
    if (body.brand_color !== undefined)
      updatePayload.brand_color = body.brand_color;
    if (body.logo_url !== undefined) updatePayload.logo_url = body.logo_url;
    if (body.cta_text !== undefined) updatePayload.cta_text = body.cta_text;
    if (body.signup_counter_enabled !== undefined)
      updatePayload.signup_counter_enabled = body.signup_counter_enabled;
    if (body.signup_counter_threshold !== undefined)
      updatePayload.signup_counter_threshold = body.signup_counter_threshold;
    if (Array.isArray(body.milestone_rewards)) {
      updatePayload.milestone_rewards_enabled =
        body.milestone_rewards.length > 0;
    }

    const { error: updateError } = await supabase
      .from("waitlists")
      .update(updatePayload)
      .eq("id", existing.id);

    if (updateError) {
      console.error("Failed to update waitlist:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Upsert milestone_rewards if provided
    if (Array.isArray(body.milestone_rewards)) {
      await supabase
        .from("milestone_rewards")
        .delete()
        .eq("waitlist_id", existing.id);
      if (body.milestone_rewards.length > 0) {
        const rewardRows = body.milestone_rewards.map(
          (r: { threshold: number; label: string }) => ({
            waitlist_id: existing.id,
            tier_referrals: r.threshold,
            reward_label: r.label,
          })
        );
        await supabase.from("milestone_rewards").insert(rewardRows);
      }
    }

    // Upsert qualification_questions if provided
    if (Array.isArray(body.questions)) {
      await supabase
        .from("qualification_questions")
        .delete()
        .eq("waitlist_id", existing.id);
      if (body.questions.length > 0) {
        const questionRows = body.questions.map(
          (q: { text: string; required: boolean }, index: number) => ({
            waitlist_id: existing.id,
            question_text: q.text,
            question_type: "free_text" as const,
            sort_order: index,
          })
        );
        await supabase.from("qualification_questions").insert(questionRows);
      }
    }

    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const insertPayload: Record<string, unknown> = {
    founder_id: user.id,
    subdomain: body.subdomain,
    headline: body.headline ?? null,
    subheadline: body.subheadline ?? null,
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

  // Upsert milestone_rewards if provided
  if (
    Array.isArray(body.milestone_rewards) &&
    body.milestone_rewards.length > 0
  ) {
    const rewardRows = body.milestone_rewards.map(
      (r: { threshold: number; label: string }) => ({
        waitlist_id: waitlistId,
        tier_referrals: r.threshold,
        reward_label: r.label,
      })
    );
    await supabase.from("milestone_rewards").insert(rewardRows);
  }

  // Upsert qualification_questions if provided
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
  const { id, milestone_rewards, questions, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing waitlist id" }, { status: 400 });
  }

  // milestone_rewards lives in a separate table, not the waitlists table.
  // Map the array presence to the boolean column.
  if (Array.isArray(milestone_rewards)) {
    updates.milestone_rewards_enabled = milestone_rewards.length > 0;
  }

  // Update waitlists table (excluding questions — that's a child table)
  const { error } = await supabase
    .from("waitlists")
    .update(updates)
    .eq("id", id)
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
      .eq("waitlist_id", id);

    // Insert new questions (all questions are free_text on public page)
    if (questions.length > 0) {
      const questionRows = questions.map(
        (q: { text: string; required: boolean }, index: number) => ({
          waitlist_id: id,
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
    await supabase.from("milestone_rewards").delete().eq("waitlist_id", id);

    // Insert new rewards
    if (milestone_rewards.length > 0) {
      const rewardRows = milestone_rewards.map(
        (r: { threshold: number; label: string }) => ({
          waitlist_id: id,
          tier_referrals: r.threshold,
          reward_label: r.label,
        })
      );

      const { error: rewardsError } = await supabase
        .from("milestone_rewards")
        .insert(rewardRows);

      if (rewardsError) {
        console.error("Failed to save milestone rewards:", rewardsError);
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

  // Get the founder's waitlist
  const { data: waitlist, error: waitlistError } = await supabase
    .from("waitlists")
    .select("*")
    .eq("founder_id", user.id)
    .single();

  if (waitlistError || !waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
  }

  // Get milestone rewards
  const { data: rewards } = await supabase
    .from("milestone_rewards")
    .select("tier_referrals, reward_label")
    .eq("waitlist_id", waitlist.id)
    .order("tier_referrals", { ascending: true });

  // Get qualification questions
  const { data: questions } = await supabase
    .from("qualification_questions")
    .select("question_text, question_type, sort_order")
    .eq("waitlist_id", waitlist.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({
    waitlistId: waitlist.id,
    slug: waitlist.subdomain || "",
    headline: waitlist.headline || "",
    subheadline: waitlist.subheadline || "",
    template: waitlist.template || "minimal",
    brandColor: waitlist.brand_color || "#0F7A5E",
    logoUrl: waitlist.logo_url || null,
    ctaText: waitlist.cta_text || "Join Waitlist",
    milestoneRewards: rewards
      ? rewards.map((r) => ({
          threshold: r.tier_referrals,
          label: r.reward_label,
        }))
      : [],
    qualificationEnabled: waitlist.qualification_enabled || false,
    questions: questions
      ? questions.map((q) => ({
          text: q.question_text,
          required: q.question_type === "free_text",
        }))
      : [],
    signupCounterEnabled: waitlist.signup_counter_enabled || false,
    signupCounterThreshold: waitlist.signup_counter_threshold || 10,
    emailSubject: waitlist.email_subject || "",
    emailSenderName: waitlist.email_sender_name || "",
    emailBody: waitlist.email_body || "",
  });
}
