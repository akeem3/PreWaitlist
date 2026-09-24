"use client";

import { useEffect, useState } from "react";

interface Answer {
  value: string;
  count: number;
  percent: number;
}

interface QuestionData {
  id: string;
  text: string;
  type: "free_text" | "multiple_choice";
  options: string[] | null;
  respondentCount: number;
  answers: Answer[];
}

interface QualificationPanelProps {
  subdomain: string;
  waitlistId?: string;
}

function respondentLabel(count: number): string {
  return `${count} ${count === 1 ? "respondent" : "respondents"}`;
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
      <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
        <div className="mb-2 h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="mb-4 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 animate-pulse rounded-full bg-muted" />
          <div className="h-2 w-1/2 animate-pulse rounded-full bg-muted" />
          <div className="h-2 w-2/3 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-[var(--card-radius)] border border-border bg-card p-5">
        <p className="text-body-sm text-muted-foreground">
          No qualification questions configured. Add questions during onboarding
          to collect subscriber data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((q) => {
        // Bars only at respondentCount >= 2 — a single respondent would
        // render a misleading 100%-full bar (14.3 AC8)
        const showBars = q.type === "multiple_choice" && q.respondentCount >= 2;

        return (
          <div
            key={q.id}
            className="rounded-[var(--card-radius)] border border-border bg-card p-5"
          >
            <p className="mb-1 text-sm font-medium text-foreground">{q.text}</p>
            <p className="mb-3 text-xs text-muted-foreground">
              {respondentLabel(q.respondentCount)}
            </p>

            {q.answers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No responses yet</p>
            ) : showBars ? (
              <div className="space-y-1.5">
                {q.answers.map((a, index) => (
                  <div key={a.value} className="flex items-center gap-3">
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className={`h-full rounded-full ${
                          index === 0 ? "bg-accent" : "bg-muted"
                        }`}
                        style={{ width: `${Math.min(a.percent, 100)}%` }}
                      />
                    </div>
                    <span
                      className="max-w-[50%] shrink-0 truncate text-xs text-muted-foreground"
                      title={a.value}
                    >
                      {a.value} ({a.count}, {a.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-1">
                {q.answers.map((a) => (
                  <li
                    key={a.value}
                    className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground"
                  >
                    <span className="min-w-0 truncate" title={a.value}>
                      {a.value}
                    </span>
                    {a.count > 1 && (
                      <span className="shrink-0">({a.count})</span>
                    )}
                  </li>
                ))}
              </ul>
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
    <PanelBody key={subdomain} subdomain={subdomain} waitlistId={waitlistId} />
  );
}
