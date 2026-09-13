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

interface BroadcastClientProps {
  waitlistId: string;
  productName: string | null;
  headline: string | null;
  subdomain: string;
  senderName: string | null;
  subscriberCount: number;
}

export default function BroadcastClient({
  productName,
  senderName,
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
  const [segment, setSegment] = useState<"all" | "hot_warm" | "cold">("cold");
  const [counts, setCounts] = useState({ all: 0, hot_warm: 0, cold: 0 });

  const displayName = senderName || productName || "PreWaitlist";

  useEffect(() => {
    async function fetchCounts() {
      const res = await fetch("/api/dashboard/broadcast/segments");
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    }
    fetchCounts();
  }, []);

  const activeCount =
    segment === "all"
      ? counts.all
      : segment === "hot_warm"
        ? counts.hot_warm
        : counts.cold;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, segment }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send broadcast");
        return;
      }

      setSent(true);
      setSentCount(data.recipient_count);
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
              Your broadcast has been delivered.
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
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
            >
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
                  From: {displayName} &lt;updates@prewaitlist.com&gt;
                </p>
                <p className="text-body-sm font-semibold text-foreground">
                  Subject: {subject}
                </p>
              </div>
              <div
                className="prose prose-sm max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: body }}
              />
              <hr className="border-border my-4" />
              <p className="text-caption text-muted-foreground">
                {displayName} — powered by PreWaitlist
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
