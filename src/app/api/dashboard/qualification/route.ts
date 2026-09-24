import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type QuestionRow = {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const waitlistId = searchParams.get("waitlist_id");
  if (!waitlistId) {
    return NextResponse.json(
      { error: "waitlist_id is required" },
      { status: 400 }
    );
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("id", waitlistId)
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from("qualification_questions")
    .select("id, question_text, question_type, options")
    .eq("waitlist_id", waitlist.id)
    .order("sort_order", { ascending: true });

  if (!questions || questions.length === 0) {
    const empty = NextResponse.json({ questions: [], respondentTotal: 0 });
    empty.headers.set(
      "Cache-Control",
      "s-maxage=30, stale-while-revalidate=60"
    );
    return empty;
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("qual_answers")
    .eq("waitlist_id", waitlist.id)
    .not("qual_answers", "is", null);

  const respondentIndexes = new Set<number>();

  const result = (questions as QuestionRow[]).map((q) => {
    const answerCounts = new Map<string, number>();
    (subscribers || []).forEach((sub, index) => {
      const answers = sub.qual_answers as Record<string, string> | null;
      // Aggregated by question_id key (14.0 migration remapped legacy
      // text-keyed answers). Orphan keys from deleted questions never match.
      const value = answers?.[q.id];
      if (typeof value === "string" && value.length > 0) {
        answerCounts.set(value, (answerCounts.get(value) || 0) + 1);
        respondentIndexes.add(index);
      }
    });

    const respondentCount = Array.from(answerCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const answers = Array.from(answerCounts.entries())
      .map(([value, count]) => ({
        value,
        count,
        percent:
          respondentCount > 0 ? Math.round((count / respondentCount) * 100) : 0,
      }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          (a.value < b.value ? -1 : a.value > b.value ? 1 : 0)
      );

    return {
      id: q.id,
      text: q.question_text,
      type:
        q.question_type === "multiple_choice"
          ? ("multiple_choice" as const)
          : ("free_text" as const),
      options: Array.isArray(q.options) ? q.options : null,
      respondentCount,
      answers,
    };
  });

  const response = NextResponse.json({
    questions: result,
    respondentTotal: respondentIndexes.size,
  });
  response.headers.set(
    "Cache-Control",
    "s-maxage=30, stale-while-revalidate=60"
  );
  return response;
}
