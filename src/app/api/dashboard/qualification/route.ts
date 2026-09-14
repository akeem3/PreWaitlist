import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "Waitlist not found" }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from("qualification_questions")
    .select("question_text")
    .eq("waitlist_id", waitlist.id)
    .order("sort_order", { ascending: true });

  if (!questions || questions.length === 0) {
    return NextResponse.json({ questions: [] });
  }

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("qual_answers")
    .eq("waitlist_id", waitlist.id)
    .not("qual_answers", "is", null);

  const result = questions.map((q) => {
    const answerCounts = new Map<string, number>();
    for (const sub of subscribers || []) {
      const answers = sub.qual_answers as Record<string, string> | null;
      if (answers && answers[q.question_text]) {
        const val = answers[q.question_text];
        answerCounts.set(val, (answerCounts.get(val) || 0) + 1);
      }
    }
    const answers = Array.from(answerCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
    return { question: q.question_text, answers };
  });

  const response = NextResponse.json({ questions: result });
  response.headers.set(
    "Cache-Control",
    "s-maxage=30, stale-while-revalidate=60"
  );
  return response;
}
