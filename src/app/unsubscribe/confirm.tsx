"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  token: string;
  waitlistName: string;
  alreadyUnsubscribed: boolean;
};

export function UnsubscribeConfirm({
  token,
  waitlistName,
  alreadyUnsubscribed,
}: Props) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(alreadyUnsubscribed);
  const [error, setError] = useState(false);

  async function confirm() {
    if (pending || done) return;
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
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
    );
  }

  return (
    <div className="text-center">
      <h1 className="mb-2 text-h2 text-foreground">Unsubscribe</h1>
      <p className="mb-6 text-body text-muted-foreground">
        Click below to stop receiving emails from {waitlistName}.
      </p>
      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Working…" : "Unsubscribe"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
