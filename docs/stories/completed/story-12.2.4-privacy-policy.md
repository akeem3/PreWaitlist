# Story 12.2.4 — Privacy Policy

**Epic:** 12.2 — Gap Fixes
**Status:** done
**Depends on:** —
**Design Refs:** —

## Story

As a founder, I need a privacy policy page so that my waitlist complies with GDPR and CCPA.

## Acceptance Criteria (EARS)

- AC1: The system shall render `/legal/privacy` as a static page with a complete privacy policy covering: data collection (email addresses, IP addresses), data usage (waitlist management, email communication), data storage (Supabase/PostgreSQL), data sharing (no third-party sharing except email delivery via Resend), user rights (access, deletion, export), cookie usage, and contact information.
- AC2: The privacy policy shall mention Resend as the email delivery sub-processor.
- AC3: The privacy policy shall include a "Last updated" date.
- AC4: The privacy policy shall be written in plain English, not legal jargon — aim for readability at an 8th-grade level.
- AC5: The marketing footer (in `MarketingLayout`) shall include a "Privacy" link pointing to `/legal/privacy`.
- AC6: The public waitlist page footer (in `PoweredByFooter`) shall include a "Privacy" link.
- AC7: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC4) Privacy policy page content · T2 (AC5-AC6) Footer links · T3 (AC7) Lint + build

## Out of Scope

GDPR consent banners (cookie banners), data processing agreements (DPAs), cookie policy (separate page), legal review (founder must have an attorney review).

## Implementation Details

### T1: Privacy policy page content

- **New file:** `src/app/legal/privacy/page.tsx`

```typescript
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-h2 text-foreground">Privacy Policy</h1>
      <p className="mb-8 text-caption text-muted-foreground">Last updated: September 2026</p>

      <div className="space-y-6 text-body text-foreground">
        <section>
          <h2 className="mb-2 text-h4 text-foreground">Introduction</h2>
          <p>
            PreWaitlist (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides a waitlist management platform.
            This Privacy Policy explains how we collect, use, and protect information when you use our
            service. By using PreWaitlist, you agree to the collection and use of information as
            described in this policy.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Information We Collect</h2>
          <p>When you or your subscribers use PreWaitlist, we collect:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Email addresses</strong> — collected when someone joins a waitlist</li>
            <li><strong>IP addresses</strong> — collected at signup for fraud prevention and GDPR compliance</li>
            <li><strong>Account information</strong> — your name and email when you create a founder account</li>
            <li><strong>Usage data</strong> — pages visited, actions taken within the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Manage waitlists and deliver email notifications</li>
            <li>Send transactional emails (confirmation, position updates, milestones)</li>
            <li>Send broadcast emails that founders compose and choose to deliver</li>
            <li>Prevent fraud and abuse of the platform</li>
            <li>Improve our service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Data Storage &amp; Security</h2>
          <p>
            Your data is stored in PostgreSQL databases hosted by Supabase. We implement industry-standard
            security measures including encryption at rest and in transit. We do not store payment card
            information directly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Third-Party Services</h2>
          <p>We use the following third-party services that process data on our behalf:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Resend</strong> — email delivery service. Your email address is shared with Resend solely for the purpose of delivering emails you have consented to receive.</li>
            <li><strong>Supabase</strong> — database and authentication provider</li>
            <li><strong>Vercel</strong> — hosting and infrastructure provider</li>
          </ul>
          <p className="mt-2">
            We do not sell, trade, or otherwise transfer your personal information to third parties for
            marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>Access</strong> — request a copy of the data we hold about you</li>
            <li><strong>Deletion</strong> — request that we delete your personal data</li>
            <li><strong>Export</strong> — request your data in a portable format</li>
            <li><strong>Unsubscribe</strong> — opt out of any email communications at any time</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at the email address below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Cookies</h2>
          <p>
            PreWaitlist uses essential cookies for authentication and session management. We do not use
            tracking cookies or third-party analytics cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Children&apos;s Privacy</h2>
          <p>
            PreWaitlist is not intended for use by children under 13. We do not knowingly collect
            information from children.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:privacy@prewaitlist.com" className="text-accent underline">
              privacy@prewaitlist.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-8 border-t border-border pt-4">
        <Link href="/" className="text-body-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

### T2: Footer links

- **File to modify:** `components/layout/marketing-layout.tsx`

Find the footer links array (look for existing footer links) and add:

```typescript
{ label: "Privacy", href: "/legal/privacy" }
```

- **File to modify:** `components/share/powered-by-footer.tsx`

Add a Privacy link next to the "Powered by" text:

```tsx
<span className={textClass}>Powered by</span>
</Link>
<span className="mx-1">·</span>
<Link href="/legal/privacy" className={`no-underline ${textClass}`}>
  Privacy
</Link>
```

### T3: Lint + build

Run `pnpm lint` and `pnpm build`.

## Verification

1. Navigate to `/legal/privacy` → privacy policy page renders
2. Content covers: data collection, usage, storage, sharing, rights, cookies, children, changes, contact
3. Mentions Resend as email sub-processor
4. Shows "Last updated: September 2026"
5. Written in plain English (8th-grade reading level)
6. Marketing footer shows "Privacy" link
7. PoweredByFooter shows "Privacy" link
8. `pnpm lint` and `pnpm build` pass with zero errors
