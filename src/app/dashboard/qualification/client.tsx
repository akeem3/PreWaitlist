"use client";

import QualificationPanel from "../../../../components/dashboard/qualification-panel";

interface QualificationClientProps {
  subdomain: string;
}

export default function QualificationClient({
  subdomain,
}: QualificationClientProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-h2 text-foreground">Qualification</h1>
      <QualificationPanel subdomain={subdomain} />
    </div>
  );
}
