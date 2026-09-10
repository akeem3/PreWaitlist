# Story 12.3 — Broadcast Email (Pro)

**Epic:** 12 — Email System
**Status:** ready
**Depends on:** 11.1, 11.7
**Design Refs:** None (dashboard UI, no high-fidelity SVG)

## Story

As a Pro founder, I want to compose and send a broadcast email to all my subscribers so that I can communicate updates and launch announcements.

## Acceptance Criteria (EARS)

- AC1: The dashboard shall display a "Broadcast" nav item that is active (clickable) for Pro founders and locked for Free founders.
- AC2: Clicking Broadcast shall open a compose screen with: subject line input, HTML body textarea, preview button, send button.
- AC3: The compose screen shall show the subscriber count ("Send to {N} subscribers").
- AC4: Clicking "Send" shall send the email via Resend's Batch API to all subscribers of the waitlist.
- AC5: The broadcast shall include an unsubscribe mechanism (`{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag) for CAN-SPAM compliance.
- AC6: The broadcast shall include a physical mailing address in the footer (CAN-SPAM requirement).
- AC7: After sending, the system shall show a confirmation: "Email sent to {N} subscribers."
- AC8: Free founders shall see an upgrade prompt when clicking Broadcast ("Upgrade to Pro to send broadcasts").
- AC9: The broadcast shall be stored in the `broadcasts` table (created in Story 11.7).
- AC10: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1, AC8) Activate Broadcast nav item for Pro, upgrade prompt for Free · T2 (AC2) Create compose screen with subject/body/preview/send · T3 (AC3) Subscriber count display · T4 (AC4-AC6) Resend Batch API + unsubscribe + footer · T5 (AC7, AC9) Send confirmation + broadcast storage · T6 (AC10) Lint + build

## Out of Scope

Warmth-segmented broadcast (Story 12.4), email customisation (Story 12.5), domain authentication (Story 13.5), email template builder (v1.1)

## Implementation Details

### T1: Activate Broadcast nav item for Pro, upgrade prompt for Free

- **File to modify:** `components/dashboard/sidebar.tsx`

The "Broadcast" nav item already exists at line 179. Currently has `locked: true`. Change to:

```typescript
// Current (line 179):
{ label: "Broadcast", href: "/dashboard/broadcast", icon: Megaphone, locked: true },

// New:
{ label: "Broadcast", href: "/dashboard/broadcast", icon: Megaphone, locked: tier === "free" },
```

The sidebar already handles locked items — shows a lock icon and disabled state. When clicked while locked, show an upgrade prompt.

**Upgrade prompt (AC8):** The existing upgrade modal (from Story 13.1, or a simple placeholder for now):

```typescript
// In sidebar click handler:
if (item.locked) {
  // Show upgrade prompt
  setUpgradeModalOpen(true);
  return;
}
```

For MVP, the upgrade prompt can be a simple `alert("Upgrade to Pro to send broadcasts")` or a modal if Story 13.1 is done.

### T2: Create compose screen

- **New file:** `src/app/dashboard/broadcast/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BroadcastPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  // AC3: Fetch subscriber count
  // (use server component or client-side fetch)

  const handlePreview = () => {
    // Open preview in new tab or modal
    // Render body as HTML in an iframe
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/dashboard/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (res.ok) {
        const data = await res.json();
        setSent(true);
        setSentCount(data.recipient_count);
      }
    } finally {
      setSending(false);
    }
  };

  // AC7: Show confirmation after send
  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-h3 text-foreground mb-2">
              Email sent to {sentCount} subscribers
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
          {/* AC3: Subscriber count */}
          <p className="text-body text-muted-foreground">
            Send to {subscriberCount} subscribers
          </p>

          {/* Subject line */}
          <div>
            <label className="text-label text-foreground">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's the update?"
              className="mt-1"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-label text-foreground">Body</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here. HTML is supported."
              rows={12}
              className="mt-1 font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePreview}>
              Preview
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {sending ? "Sending..." : "Send to all subscribers"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Preview:** Opens the email body in an iframe with the subject line as a mock email header. Shows how the email will look in a recipient's inbox.

### T3: Subscriber count display

Fetch subscriber count from the `waitlists` table's `subscriber_count` column (cached counter from Story 11.7) — avoid `COUNT(*)` on every page load.

**Option A (server component):** Pass count from page.tsx (server) to the client component
**Option B (client fetch):** Fetch from an API endpoint: `GET /api/dashboard/broadcast/count`

Recommended: Option A — server component fetches count, passes as prop.

### T4: Resend Batch API + unsubscribe + footer

- **New file:** `src/app/api/dashboard/broadcast/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

// POST /api/dashboard/broadcast — send broadcast to all subscribers
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tier check (AC8)
  const { data: profile } = await supabase
    .from("founder_profiles")
    .select("tier")
    .eq("user_id", user.id)
    .single();

  if (profile?.tier !== "pro") {
    return NextResponse.json(
      { error: "Pro subscription required" },
      { status: 403 }
    );
  }

  const { subject, body } = await req.json();

  // Validate
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: "Subject and body required" },
      { status: 400 }
    );
  }

  // Get waitlist
  const { data: waitlist } = await supabase
    .from("waitlists")
    .select("id, subdomain, product_name, headline, sender_name")
    .eq("founder_id", user.id)
    .single();

  if (!waitlist) {
    return NextResponse.json({ error: "No waitlist found" }, { status: 404 });
  }

  // Fetch all subscribers (paginated for large lists)
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email")
    .eq("waitlist_id", waitlist.id);

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: "No subscribers" }, { status: 400 });
  }

  // AC6: Physical mailing address (CAN-SPAM requirement)
  const mailingAddress = "PreWaitlist, [Founder Address Placeholder]";

  // Build email HTML with unsubscribe
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 16px;">
      ${body}
      <hr style="border: none; border-top: 1px solid #ccc9c3; margin: 32px 0;" />
      <p style="font-size: 12px; color: #6b6459; margin: 0 0 8px;">
        ${mailingAddress}
      </p>
      <p style="font-size: 12px; color: #6b6459; margin: 0;">
        <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color: #6b6459;">Unsubscribe</a>
      </p>
    </div>
  `;

  // AC4: Resend Batch API (max 100 per batch)
  const BATCH_SIZE = 100;
  let totalSent = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const emails = batch.map((sub) => ({
      from: `${waitlist.sender_name || waitlist.product_name || "PreWaitlist"} <notifications@prewaitlist.com>`,
      to: [sub.email],
      subject,
      html,
    }));

    const result = await resend.batch.send(emails);

    if (result.error) {
      // Log error but continue with next batch
      console.error("Batch send error:", result.error);
    } else {
      totalSent += batch.length;
    }
  }

  // AC9: Store broadcast in broadcasts table
  await supabase.from("broadcasts").insert({
    waitlist_id: waitlist.id,
    subject,
    recipient_count: totalSent,
    sent_at: new Date().toISOString(),
  });

  // AC7: Return confirmation
  return NextResponse.json({
    ok: true,
    recipient_count: totalSent,
  });
}
```

**CAN-SPAM compliance notes:**

- **Unsubscribe:** `{{{RESEND_UNSUBSCRIBE_URL}}}` is a Resend merge tag — Resend auto-replaces with a per-recipient unsubscribe link. Required for Gmail/Yahoo deliverability (5,000+ daily sends).
- **Physical address:** Required by CAN-SPAM Act. Use a real address for production. Placeholder for MVP.
- **List-Unsubscribe header:** Verify Resend auto-adds RFC 8058 one-click unsubscribe header for Batch API sends. Required for Gmail/Yahoo.

### T5: Send confirmation + broadcast storage

- AC7: Return `recipient_count` from the API, display in the compose screen confirmation
- AC9: Insert into `broadcasts` table after successful send (already in the route handler above)

### T6: Lint + build

- Run `pnpm lint` and `pnpm build`
- Fix any TypeScript errors

## Verification

1. Create `src/app/dashboard/broadcast/page.tsx` (compose screen)
2. Create `src/app/api/dashboard/broadcast/route.ts` (API route)
3. Modify `components/dashboard/sidebar.tsx` — change Broadcast `locked: true` to `locked: tier === "free"`
4. Log in as Pro founder → verify Broadcast nav item is clickable
5. Log in as Free founder → verify Broadcast nav item is locked, shows upgrade prompt
6. As Pro founder, click Broadcast → verify compose screen loads with subject, body, preview, send
7. Verify subscriber count displays ("Send to {N} subscribers")
8. Type a subject and body → click Preview → verify preview shows the email
9. Click Send → verify email is sent to all subscribers
10. Verify confirmation shows "Email sent to {N} subscribers"
11. Verify `broadcasts` table has a new row with correct subject and recipient_count
12. Verify subscribers received the email with unsubscribe link and physical address
13. Run `pnpm lint` and `pnpm build` — verify zero errors
