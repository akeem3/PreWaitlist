import { redirect, notFound } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import Link from "next/link";
import { EmailEventLog } from "../../../../../components/dashboard/email-event-log";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SubscriberDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select(
      `
      id, email, position, referral_code, qual_answers, created_at,
      waitlists!inner (
        id, founder_id, subdomain, headline
      )
    `
    )
    .eq("id", id)
    .single();

  if (
    !subscriber ||
    (subscriber.waitlists as unknown as { founder_id: string }).founder_id !==
      user.id
  ) {
    notFound();
  }

  const { data: referrals } = await supabase
    .from("subscribers")
    .select("id, email, position, created_at")
    .eq("referrer_id", id)
    .order("created_at", { ascending: true });

  const referralCount = referrals?.length || 0;

  const qualAnswers = subscriber.qual_answers as Record<string, string> | null;

  // 14.4 audit fix: qual_answers keys are question ids (Epic 14 remap) —
  // resolve them to question_text for display; fall back to the raw key
  // when the question was deleted after the answer was stored.
  const waitlistRef = subscriber.waitlists as unknown as { id: string };
  const { data: questions } = await supabase
    .from("qualification_questions")
    .select("id, question_text")
    .eq("waitlist_id", waitlistRef.id)
    .order("sort_order", { ascending: true });
  const questionLabels = new Map<string, string>(
    (questions || []).map((q) => [q.id, q.question_text])
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mb-2 text-h2 text-foreground">Subscriber detail</h1>
        <p className="mb-8 text-body-sm text-muted-foreground">
          {subscriber.email}
        </p>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
            <h3 className="mb-1 text-caption text-muted-foreground">
              Position
            </h3>
            <p className="text-h3 text-foreground">#{subscriber.position}</p>
          </div>
          <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
            <h3 className="mb-1 text-caption text-muted-foreground">
              Referrals
            </h3>
            <p className="text-h3 text-foreground">{referralCount}</p>
          </div>
          <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
            <h3 className="mb-1 text-caption text-muted-foreground">Joined</h3>
            <p className="text-h3 text-foreground">
              {subscriber.created_at.split("T")[0]}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
          <h3 className="mb-3 text-body-sm font-medium text-foreground">
            Email
          </h3>
          <p className="text-body-sm text-foreground">{subscriber.email}</p>
        </div>

        <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
          <h3 className="mb-3 text-body-sm font-medium text-foreground">
            Referral code
          </h3>
          <p className="text-body-sm text-foreground">
            {subscriber.referral_code}
          </p>
        </div>

        {referralCount > 0 && (
          <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
            <h3 className="mb-3 text-body-sm font-medium text-foreground">
              Referred subscribers
            </h3>
            <ul className="space-y-2">
              {referrals!.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-body-sm text-muted-foreground"
                >
                  <span>{r.email}</span>
                  <span>{r.created_at.split("T")[0]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {qualAnswers && Object.keys(qualAnswers).length > 0 && (
          <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
            <h3 className="mb-3 text-body-sm font-medium text-foreground">
              Qualification answers
            </h3>
            <dl className="space-y-3">
              {Object.entries(qualAnswers).map(([question, answer]) => (
                <div key={question}>
                  <dt className="text-caption text-muted-foreground">
                    {questionLabels.get(question) ?? question}
                  </dt>
                  <dd className="text-body-sm text-foreground">
                    {answer as string}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mb-6 rounded-[var(--card-radius)] border border-border bg-card p-5">
          <h3 className="mb-3 text-body-sm font-medium text-foreground">
            Email events
          </h3>
          <EmailEventLog subscriberId={id} />
        </div>
      </main>
    </div>
  );
}
