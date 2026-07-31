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
    const { error: updateError } = await supabase
      .from("waitlists")
      .update({
        subdomain: body.subdomain,
        headline: body.headline ?? null,
        subheadline: body.subheadline ?? null,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Failed to update waitlist:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("waitlists")
    .insert({
      founder_id: user.id,
      subdomain: body.subdomain,
      headline: body.headline ?? null,
      subheadline: body.subheadline ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create waitlist:", error);
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
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

    // Insert new questions
    if (questions.length > 0) {
      const questionRows = questions.map(
        (q: { text: string; required: boolean }, index: number) => ({
          waitlist_id: id,
          question_text: q.text,
          question_type: q.required ? "free_text" : "multiple_choice",
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

  return NextResponse.json({ success: true });
}
