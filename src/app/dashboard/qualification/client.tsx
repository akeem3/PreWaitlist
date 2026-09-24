"use client";

import Link from "next/link";
import QualificationPanel from "../../../../components/dashboard/qualification-panel";

interface QualificationClientProps {
  subdomain: string;
  waitlistId: string;
}

export default function QualificationClient({
  subdomain,
  waitlistId,
}: QualificationClientProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-h2 text-foreground">Qualification</h1>
        <Link
          href={`/dashboard/${waitlistId}/settings?tab=qualification`}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-[var(--button-radius)] border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors duration-normal ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Edit questions
        </Link>
      </div>
      <QualificationPanel subdomain={subdomain} waitlistId={waitlistId} />
    </div>
  );
}
