import Link from "next/link";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { ResubscribeConfirm } from "./confirm";

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

  // 4.6: GET validates only — the resubscribe itself happens on POST
  // (confirm button below), so prefetchers and scanners can't trigger it.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <ResubscribeConfirm token={token} />
    </div>
  );
}
