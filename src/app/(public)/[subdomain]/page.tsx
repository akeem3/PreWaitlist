import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ subdomain: string }> };

export default async function PublicSubdomainPage({ params }: Props) {
  const { subdomain } = await params;

  const supabase = await createClient();

  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, signup_counter_enabled, signup_counter_threshold, headline")
    .eq("subdomain", subdomain)
    .single();

  let signupCount = 0;
  let counterVisible = false;

  if (waitlist?.signup_counter_enabled) {
    try {
      const { count } = await supabase
        .from("subscribers")
        .select("id", { count: "exact", head: true })
        .eq("waitlist_id", waitlist.id);

      signupCount = count ?? 0;
      counterVisible = signupCount >= (waitlist.signup_counter_threshold || 10);
    } catch {
      // subscribers table doesn't exist yet
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-h2 mb-2">{waitlist?.headline || subdomain}</h1>
        <p className="text-body-lg text-muted-foreground mb-4">
          Public waitlist page — Sprint 2
        </p>
        {counterVisible && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {signupCount.toLocaleString()}
            </span>{" "}
            people in line
          </p>
        )}
      </div>
    </div>
  );
}
