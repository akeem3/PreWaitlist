"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Panel, { panelChrome } from "./panel";

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

interface QualificationData {
  questions: QuestionData[];
  respondentTotal: number;
}

type Variant = "page" | "overview";

interface QualificationPanelProps {
  subdomain: string;
  waitlistId?: string;
  variant?: Variant;
}

function respondentLabel(count: number): string {
  return `${count} ${count === 1 ? "respondent" : "respondents"}`;
}

function questionLabel(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}

function typeLabel(type: QuestionData["type"]): string {
  return type === "free_text" ? "Free text" : "Multiple choice";
}

function TypeBadge({ type }: { type: QuestionData["type"] }) {
  return (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {typeLabel(type)}
    </span>
  );
}

function EmptyState() {
  return (
    <p className="text-body-sm text-muted-foreground">
      No qualification questions configured. Add questions during onboarding to
      collect subscriber data.
    </p>
  );
}

function QuestionViz({
  question,
  answerCap,
}: {
  question: QuestionData;
  answerCap?: number;
}) {
  const { answers: allAnswers, respondentCount, type } = question;
  const answers =
    answerCap != null ? allAnswers.slice(0, answerCap) : allAnswers;

  if (allAnswers.length === 0) {
    return <p className="text-xs text-muted-foreground">No responses yet</p>;
  }

  // Bars only at respondentCount >= 2 — a single respondent would render a
  // misleading 100%-full bar (14.3 AC8)
  const showBars = type === "multiple_choice" && respondentCount >= 2;

  if (showBars) {
    return (
      <div className="space-y-1.5">
        {answers.map((a, index) => (
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
    );
  }

  return (
    <ul className="space-y-1.5">
      {answers.map((a) => (
        <li
          key={a.value}
          className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-foreground"
        >
          <span className="min-w-0 truncate" title={a.value}>
            {a.value}
          </span>
          {a.count > 1 && (
            <span className="shrink-0 text-muted-foreground">({a.count})</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function QuestionContent({
  question,
  index,
  compact = false,
  answerCap,
}: {
  question: QuestionData;
  index: number;
  compact?: boolean;
  answerCap?: number;
}) {
  return (
    <>
      <div
        className={
          compact
            ? "mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1"
            : "mb-2 flex items-center justify-between gap-2"
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
            {index + 1}
          </span>
          <TypeBadge type={question.type} />
        </span>
        <span className="shrink-0 text-xs text-accent">
          {respondentLabel(question.respondentCount)}
        </span>
      </div>
      <p
        className={
          compact
            ? "mb-3 line-clamp-1 text-sm font-medium text-foreground"
            : "mb-3 text-sm font-medium text-foreground"
        }
        title={compact ? question.text : undefined}
      >
        {question.text}
      </p>
      <QuestionViz question={question} answerCap={answerCap} />
    </>
  );
}

function PanelBody({
  subdomain,
  waitlistId,
  variant,
}: {
  subdomain: string;
  waitlistId?: string;
  variant: Variant;
}) {
  const [data, setData] = useState<QualificationData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const widParam = waitlistId ? `?waitlist_id=${waitlistId}` : "";
    fetch(`/api/dashboard/qualification${widParam}`)
      .then((res) => {
        // Story 19.4 row 25: a failed load must not render as
        // "No qualification questions configured" / "No responses yet".
        if (!res.ok) throw new Error("load failed");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setLoadError(false);
          setData({
            questions: json.questions || [],
            respondentTotal: json.respondentTotal || 0,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [subdomain, waitlistId]);

  const viewAllLink = (
    <Link
      href={`/dashboard/qualification${waitlistId ? `?wid=${waitlistId}` : ""}`}
      className="text-body-sm font-medium text-accent transition-colors hover:text-accent/80"
    >
      View all &rarr;
    </Link>
  );

  if (loadError) {
    if (variant === "overview") {
      return (
        <Panel title="Qualification Breakdown" action={viewAllLink}>
          <p
            role="alert"
            className="py-6 text-center text-body-sm text-destructive"
          >
            Something went wrong. Please try again.
          </p>
        </Panel>
      );
    }

    return (
      <div className={panelChrome}>
        <p role="alert" className="text-body-sm text-destructive">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }

  if (data === null) {
    if (variant === "overview") {
      return (
        <Panel title="Qualification Breakdown" action={viewAllLink}>
          <div className="space-y-3">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
          </div>
        </Panel>
      );
    }

    return (
      <div className={panelChrome}>
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

  const { questions, respondentTotal } = data;

  if (questions.length === 0) {
    if (variant === "overview") {
      return (
        <Panel title="Qualification Breakdown" action={viewAllLink}>
          <EmptyState />
        </Panel>
      );
    }
    return (
      <div className={panelChrome}>
        <EmptyState />
      </div>
    );
  }

  const meta = (
    <p className="mb-4 text-body-sm text-muted-foreground">
      <span className="text-accent">{respondentLabel(respondentTotal)}</span>
      {" · "}
      {questionLabel(questions.length)}
    </p>
  );

  if (variant === "overview") {
    // 1-2 questions: stacked (pixel-identical to the original teaser).
    // 3+: bounded container-query grid so the card never outgrows the
    // 2-question height — 1 col <300px, 2 cols >=300px, 3 cols >=440px.
    // Answer cap keeps cells bounded (silent per decision): top 2, top 1 at
    // 5 questions so a 2-col/3-row layout still fits the height budget.
    const isGrid = questions.length >= 3;
    const answerCap = questions.length >= 5 ? 1 : 2;
    return (
      <Panel title="Qualification Breakdown" action={viewAllLink}>
        {meta}
        <div className="@container">
          <div
            className={
              isGrid
                ? "grid grid-cols-1 gap-4 @min-[300px]:grid-cols-2 @min-[440px]:grid-cols-3"
                : "space-y-4"
            }
          >
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={
                  !isGrid && index > 0
                    ? "border-t border-border pt-4"
                    : undefined
                }
              >
                <QuestionContent
                  question={q}
                  index={index}
                  compact={isGrid}
                  answerCap={isGrid ? answerCap : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <>
      {meta}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {questions.map((q, index) => (
          <div key={q.id} className={panelChrome}>
            <QuestionContent question={q} index={index} />
          </div>
        ))}
      </div>
    </>
  );
}

export default function QualificationPanel({
  subdomain,
  waitlistId,
  variant = "page",
}: QualificationPanelProps) {
  return (
    <PanelBody
      key={subdomain}
      subdomain={subdomain}
      waitlistId={waitlistId}
      variant={variant}
    />
  );
}
