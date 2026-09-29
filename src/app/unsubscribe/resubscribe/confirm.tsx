"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * 4.6: confirm step for resubscribing — the state change happens on POST
 * (see `/api/unsubscribe/resubscribe`), never on link open. Copy reuses
 * existing strings only ("Changed your mind?", the resubscribed body
 * sentence, "Resubscribe", and the generic error line).
 */
export function ResubscribeConfirm({ token }: { token: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  async function confirm() {
    if (pending || done) return;
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/unsubscribe/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
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
    );
  }

  return (
    <div className="text-center">
      <h1 className="mb-2 text-h2 text-foreground">Changed your mind?</h1>
      <p className="mb-6 text-body text-muted-foreground">
        You will receive emails from this waitlist again.
      </p>
      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Working…" : "Resubscribe"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
