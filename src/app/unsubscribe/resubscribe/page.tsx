import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-h2 text-foreground">Invalid link</h1>
          <p className="text-body text-muted-foreground">
            This resubscribe link is invalid.
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
            This resubscribe link is invalid.
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
  await supabase
    .from("subscribers")
    .update({ unsubscribed_at: null })
    .eq("id", subscriberId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-2 text-h2 text-foreground">Resubscribed!</h1>
        <p className="mb-6 text-body text-muted-foreground">
          You have been resubscribed. You will receive emails from this waitlist
          again.
        </p>
        <Link href="/" className="text-body-sm text-accent hover:underline">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
