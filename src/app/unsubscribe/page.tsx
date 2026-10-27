import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { UnsubscribeConfirm } from "./confirm";

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

  const supabase = createAdminClient();

  const { data: subscriber, error: subscriberError } = await supabase
    .from("subscribers")
    .select("id, waitlist_id, unsubscribed_at")
    .eq("id", subscriberId)
    .single();

  if (subscriberError) {
    console.error(
      "[unsubscribe page] subscriber lookup failed:",
      subscriberError.message
    );
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-body text-muted-foreground">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-h2 text-foreground">Invalid link</h1>
          <p className="text-body text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const { data: waitlist, error: waitlistError } = await supabase
    .from("waitlists")
    .select("product_name, headline")
    .eq("id", subscriber.waitlist_id)
    .single();

  if (waitlistError) {
    console.error(
      "[unsubscribe page] waitlist lookup failed:",
      waitlistError.message
    );
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-body text-muted-foreground">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }

  const waitlistName =
    waitlist?.product_name || waitlist?.headline || "this waitlist";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <UnsubscribeConfirm
        token={token}
        waitlistName={waitlistName}
        alreadyUnsubscribed={!!subscriber.unsubscribed_at}
      />
    </div>
  );
}
