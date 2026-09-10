"use client";

import { useEffect, useState } from "react";

type EmailEvent = {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

export const eventCache = new Map<string, EmailEvent[]>();

const SEVERITY_STYLES: Record<string, string> = {
  delivered: "bg-green-100 text-green-800",
  opened: "bg-blue-100 text-blue-800",
  clicked: "bg-accent/10 text-accent",
  bounced: "bg-red-100 text-red-700",
  complained: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  sent: "bg-muted text-muted-foreground",
  delivery_delayed: "bg-yellow-100 text-yellow-800",
};

function EventBadge({ eventType }: { eventType: string }) {
  const style = SEVERITY_STYLES[eventType] || "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {eventType}
    </span>
  );
}

function EventPayload({ data }: { data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-xs text-muted-foreground">No additional data</p>;
  }
  return (
    <pre className="overflow-x-auto rounded bg-muted p-3 text-xs text-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function EmailEventLog({ subscriberId }: { subscriberId: string }) {
  const cacheKey = `email-events-${subscriberId}`;

  const [events, setEvents] = useState<EmailEvent[]>(() => {
    const cached = eventCache.get(cacheKey);
    return cached || [];
  });
  const [loading, setLoading] = useState(() => !eventCache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (eventCache.has(cacheKey)) {
      return;
    }

    fetch(`/api/dashboard/email-events?subscriber_id=${subscriberId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load events");
        return res.json();
      })
      .then((data) => {
        eventCache.set(cacheKey, data.events);
        setEvents(data.events);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subscriberId, cacheKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">Failed to load events: {error}</p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No email events recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const isExpanded = expandedId === event.id;
        return (
          <div key={event.id}>
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : event.id)}
              className="flex w-full items-center justify-between rounded border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <EventBadge eventType={event.event_type} />
                <span className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {isExpanded ? "▲" : "▼"}
              </span>
            </button>
            {isExpanded && (
              <div className="border border-t-0 border-border bg-card px-4 pb-3 pt-1">
                <EventPayload data={event.event_data} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
