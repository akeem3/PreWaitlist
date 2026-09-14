# Story 12.2.3 — Settings Page Overhaul

**Status:** done
**Depends on:** 12.2.0, 12.2.1, 12.2.2

**Story:** As a founder, I want a three-level settings hierarchy (hub → waitlist list → waitlist detail) so that I can manage my account and multiple waitlists from a single entry point, with a clean navigation flow.

**Acceptance Criteria (EARS):**

- AC1: `/dashboard/settings` shall render a hub page with two category cards: "Waitlist Settings" (links to `/dashboard/settings/waitlists`) and "Profile" (links to `/dashboard/settings/profile`). Each card shall display an icon, title, description, and arrow indicator.
- AC2: `/dashboard/settings` shall fetch the founder's waitlist count and display it on the Waitlist Settings card (e.g., "3 waitlists" or "No waitlists yet").
- AC3: `/dashboard/settings/waitlists` shall render a list of all the founder's waitlists, each showing: name (headline or "Untitled waitlist"), subdomain, active/archived status badge, and subscriber count. Empty state shall show a CTA to create the first waitlist.
- AC4: Clicking a waitlist in the list shall navigate to `/dashboard/[waitlistId]/settings` — the existing waitlist detail page with all tabs preserved.
- AC5: `/dashboard/settings/profile` shall render account settings with horizontal tabs: Profile and Security. The Profile tab shall show a placeholder for profile management. The Security tab shall show a Sign Out button and a disabled password reset placeholder.
- AC6: `/dashboard/settings/security` shall redirect to `/dashboard/settings/profile`.
- AC7: The Content tab on `/dashboard/[waitlistId]/settings` shall render the form above the preview (stacked layout), not side-by-side. The preview shall always be visible below the form.
- AC8: The sidebar "Settings" link shall point to `/dashboard/settings` (the hub), not to a specific waitlist's settings. The sidebar shall not need a `waitlistId` for the Settings link.
- AC9: All existing waitlist settings functionality (Content, Email, Warmth, Billing, Advanced tabs, save logic, archive) shall be preserved unchanged in the waitlist detail page.
- AC10: Lint and build shall pass with zero errors.

**Tasks:** T1 (AC1-AC2) Settings hub page · T2 (AC3-AC4) Waitlist list page · T3 (AC5-AC6) Profile page · T4 (AC7) Fix Content tab preview layout · T5 (AC8) Sidebar update · T6 (AC10) Lint + build

**Out of scope:** Theme as a separate settings category (stays per-waitlist in Content tab), waitlist switcher in sidebar, profile editing (placeholder only).

**Dev Notes:**

- **Route structure:**
  - `/dashboard/settings/page.tsx` — hub with category cards (rewritten)
  - `/dashboard/settings/client.tsx` — hub client component
  - `/dashboard/settings/waitlists/page.tsx` — waitlist list (new)
  - `/dashboard/settings/waitlists/client.tsx` — waitlist list client (new)
  - `/dashboard/settings/profile/page.tsx` — profile page (new)
  - `/dashboard/settings/profile/client.tsx` — profile client with tabs (new)
  - `/dashboard/settings/security/page.tsx` — redirect to profile
  - `/dashboard/[waitlistId]/settings/client.tsx` — Content tab layout fixed (stacked)
- **Sidebar changes:** `components/dashboard/sidebar.tsx` — Settings href changed to `/dashboard/settings`, `waitlistId` parameter removed from `buildNavSections()` and `SidebarProps`.
- **Shell changes:** `src/app/dashboard/shell.tsx` — removed `waitlistId` from Sidebar call (kept in props for `handleUnarchive`).
- **Import paths:** `components/` is at project root (not under `src/`), so imports use 5 `..` levels. `lib/` is under `src/`, so imports use 4 `..` levels.
