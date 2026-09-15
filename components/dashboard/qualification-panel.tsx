"use client";

import { useEffect, useState } from "react";

interface Answer {
  value: string;
  count: number;
}

interface QuestionData {
  question: string;
  answers: Answer[];
}

interface QualificationPanelProps {
  subdomain: string;
  waitlistId?: string;
}

function PanelBody({
  subdomain,
  waitlistId,
}: {
  subdomain: string;
  waitlistId?: string;
}) {
  const [data, setData] = useState<QuestionData[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const widParam = waitlistId ? `?waitlist_id=${waitlistId}` : "";
    fetch(`/api/dashboard/qualification${widParam}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(json.questions || []);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, [subdomain, waitlistId]);

  if (data === null) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, qi) => (
          <div key={qi} className="space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, ai) => (
                <div key={ai} className="flex items-center gap-3">
                  <div className="h-2 flex-1 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-body-sm text-muted-foreground">
        No qualification questions configured
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {data.map((q) => {
        const maxCount = Math.max(...q.answers.map((a) => a.count), 1);
        return (
          <div key={q.question}>
            <p className="mb-2 text-sm font-medium text-foreground">
              {q.question}
            </p>
            {q.answers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No answers yet</p>
            ) : (
              <div className="space-y-1.5">
                {q.answers.map((a) => (
                  <div key={a.value} className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${(a.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.value} ({a.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function QualificationPanel({
  subdomain,
  waitlistId,
}: QualificationPanelProps) {
  return (
    <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
      <h3 className="mb-4 text-lg font-semibold text-foreground">
        Qualification Breakdown
      </h3>
      <PanelBody
        key={subdomain}
        subdomain={subdomain}
        waitlistId={waitlistId}
      />
    </div>
  );
}
