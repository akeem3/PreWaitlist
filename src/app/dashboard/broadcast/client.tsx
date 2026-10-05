"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  BROADCAST_BODY_MAX,
  BROADCAST_SUBJECT_MAX,
} from "@/lib/broadcast-limits";
import { resolveFromAddress } from "@/lib/from-address";
import { sanitizeEmailHtml } from "@/lib/sanitize";

// COPY GAP B7 — interim honest wording ("sent", not "delivered"): Batch API
// accept/queue is not inbox delivery; real delivery is the Epic 11
// `delivered` webhook. Founder approval required before treating as final.
const SUCCESS_SUB_COPY = "Your broadcast has been sent.";

interface BroadcastClientProps {
  waitlistId: string;
  productName: string | null;
  headline: string | null;
  subdomain: string;
  senderName: string | null;
  sendingDomain: string | null;
}

export default function BroadcastClient({
  waitlistId,
  productName,
  headline,
  senderName,
  sendingDomain,
}: BroadcastClientProps) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [sentSegment, setSentSegment] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [segment, setSegment] = useState<"all" | "hot_warm" | "cold">("all");
  const [counts, setCounts] = useState({ all: 0, hot_warm: 0, cold: 0 });

  // Story 17.3 AC2-AC3: preview From must equal the send path's `from`
  // (route.ts calls the same helper) — including the verified sending
  // domain. Never hand-build the local-part.
  const previewFrom = resolveFromAddress(
    senderName,
    productName,
    headline,
    "broadcast",
    sendingDomain
  );

  useEffect(() => {
    async function fetchCounts() {
      const res = await fetch(
        `/api/dashboard/broadcast/segments?wid=${waitlistId}`
      );
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    }
    fetchCounts();
  }, [waitlistId]);

  const activeCount =
    segment === "all"
      ? counts.all
      : segment === "hot_warm"
        ? counts.hot_warm
        : counts.cold;

  // Story 17.2 AC5: client-side caps mirror the server 400 (trimmed
  // lengths, shared constants from Story 17.0).
  const subjectLength = subject.trim().length;
  const bodyLength = body.trim().length;
  const overCaps =
    subjectLength > BROADCAST_SUBJECT_MAX || bodyLength > BROADCAST_BODY_MAX;
  const canSend = subjectLength > 0 && bodyLength > 0 && !overCaps;

  const handleSend = async () => {
    if (!canSend) return;

    const confirmed = window.confirm(
      `Send this email to ${activeCount} subscriber${activeCount !== 1 ? "s" : ""}? This cannot be undone.`
    );
    if (!confirmed) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          segment,
          waitlist_id: waitlistId, // Story 17.2 AC1 (Standing Decision B1)
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.errors?.[0] || data?.error || "Failed to send broadcast"
        );
        return;
      }

      if (data?.ok === false) {
        setError(
          data?.errors?.[0] || data?.error || "Failed to send broadcast"
        );
        return;
      }

      setSent(true);
      setSentCount(data?.recipient_count ?? 0);
      setSentSegment(
        segment === "all"
          ? ""
          : segment === "hot_warm"
            ? " hot + warm"
            : " cold"
      );
    } catch {
      setError("Network error — please try again");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-h3 text-foreground mb-2">
              Sent to {sentCount}
              {sentSegment} subscriber{sentCount !== 1 ? "s" : ""}
            </p>
            <p className="text-body text-muted-foreground mb-6">
              {SUCCESS_SUB_COPY}
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-h2 text-foreground mb-6">Broadcast Email</h1>

      <Card>
        <CardHeader>
          <CardTitle>Compose broadcast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-label text-foreground mb-2 block">
              Send to
            </label>
            <div className="flex gap-2">
              {[
                { value: "all" as const, label: `All (${counts.all})` },
                {
                  value: "hot_warm" as const,
                  label: `Hot + Warm (${counts.hot_warm})`,
                },
                { value: "cold" as const, label: `Cold (${counts.cold})` },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSegment(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    segment === option.value
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-card text-muted-foreground hover:border-foreground/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-body-sm text-muted-foreground">
            Send to{" "}
            <span className="font-medium text-foreground">{activeCount}</span>{" "}
            subscriber{activeCount !== 1 ? "s" : ""}
            {segment !== "all" && (
              <span className="text-muted-foreground">
                {" "}
                ({segment === "hot_warm" ? "hot + warm" : "cold"} segment)
              </span>
            )}
          </p>

          <div>
            <label
              htmlFor="broadcast-subject"
              className="text-label text-foreground"
            >
              Subject
            </label>
            <Input
              id="broadcast-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's the update?"
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="broadcast-body"
              className="text-label text-foreground"
            >
              Body
            </label>
            <Textarea
              id="broadcast-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here. HTML is supported."
              rows={12}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {error && <p className="text-body-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
              type="button"
            >
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button onClick={handleSend} disabled={sending || !canSend}>
              {sending
                ? "Sending..."
                : `Send to ${activeCount} subscriber${activeCount !== 1 ? "s" : ""}`}
            </Button>
          </div>

          {showPreview && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-caption text-muted-foreground mb-2">
                Preview — how recipients will see this email
              </p>
              <div className="border-b border-border pb-2 mb-2">
                <p className="text-body-sm font-semibold text-foreground">
                  From: {previewFrom}
                </p>
                <p className="text-body-sm font-semibold text-foreground">
                  Subject: {subject}
                </p>
              </div>
              <div
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(body) }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
