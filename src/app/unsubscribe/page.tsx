import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-h2 text-foreground">Invalid link</h1>
          <p className="text-body text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-body-sm text-accent hover:underline">
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subscriberId = verifyUnsubscribeToken(token);

  if (!subscriberId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-h2 text-foreground">Invalid link</h1>
          <p className="text-body text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-body-sm text-accent hover:underline">
              Go to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: subscriber } = await supabase
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriberId)
    .select("id, waitlist_id")
    .single();

  let waitlistName = "this waitlist";
  if (subscriber) {
    const { data: waitlist } = await supabase
      .from("waitlists")
      .select("product_name, headline")
      .eq("id", subscriber.waitlist_id)
      .single();
    waitlistName =
      waitlist?.product_name || waitlist?.headline || "this waitlist";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-h2 text-foreground">Unsubscribed</h1>
        <p className="mb-6 text-body text-muted-foreground">
          You have been unsubscribed from {waitlistName} emails. You will no
          longer receive emails from this waitlist.
        </p>
        <Link
          href={`/unsubscribe/resubscribe?token=${token}`}
          className="text-body-sm text-accent underline"
        >
          Changed your mind? Resubscribe
        </Link>
      </div>
    </div>
  );
}
