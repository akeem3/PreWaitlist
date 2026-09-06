# Epic 9 — Manual QA Checklist

**Purpose:** Browser-level verification that all Epic 9 dashboard restructure features work end-to-end after running `pnpm dev`.

---

## 1. Dashboard Layout (Story 9.0)

- [ ] Left sidebar visible on desktop (268px wide)
- [ ] Sidebar shows waitlist name + logo placeholder
- [ ] Sidebar nav items: Overview, Subscribers, Qualification, Leaderboard, Warmth, Updates, Broadcast, Settings
- [ ] Active item (Overview) highlighted in green
- [ ] Disabled items (Qualification, Leaderboard, Updates, Settings) appear faded, no click response
- [ ] Locked items (Warmth, Broadcast) show lock icon, no click response
- [ ] "Upgrade to pro" link at bottom of sidebar
- [ ] Sign out button works
- [ ] Mobile: hamburger icon toggles sidebar open/closed
- [ ] Mobile: backdrop overlay appears, clicking it closes sidebar

## 2. Stat Cards (Story 9.1)

- [ ] 4 cards displayed: Total signups, Referral %, Today, Warmth
- [ ] Total signups shows correct subscriber count
- [ ] Referral % shows correct percentage (or em-dash if no referrals)
- [ ] Today shows today's signup count
- [ ] Warmth card shows lock icon overlay (placeholder)
- [ ] Em-dash shown when no data

## 3. Subscriber Table (Story 9.2)

- [ ] 4 columns: #, Subscriber Email, Signup Date, Referrals
- [ ] Subscribers listed in position order (default sort)
- [ ] Search box filters by email in real-time
- [ ] "No subscribers yet" shown when empty
- [ ] "No subscribers match your search" when search has no results
- [ ] Click subscriber row → navigates to detail page
- [ ] Click "Referrals" header → sorts by referral count
- [ ] Click "#" header → sorts by position
- [ ] Sort arrow indicator appears on active column
- [ ] Signup date shows YYYY-MM-DD format

## 4. CSV Export (Story 9.3)

- [ ] "Export CSV" button visible when tier = Pro
- [ ] "Export CSV" button hidden when tier = Free
- [ ] Click export → downloads CSV file
- [ ] CSV filename: `subscribers-{subdomain}-{YYYY-MM-DD}.csv`
- [ ] CSV headers: position, email, referral_code, referral_count, created_at
- [ ] CSV data matches displayed subscribers
- [ ] If search is active, CSV exports only filtered results

## 5. Subscriber Detail (Story 9.4)

- [ ] Click subscriber row from table → opens detail page
- [ ] Shows "← Back to dashboard" link → navigates back
- [ ] Shows subscriber email
- [ ] Shows position (#N), referral count, signup date in 3-column grid
- [ ] Shows Email section
- [ ] Shows Referral code section
- [ ] If subscriber has referrals → "Referred subscribers" list appears with emails + dates
- [ ] If subscriber answered qualification questions → "Qualification answers" section shows Q&A
- [ ] Direct URL access to other founder's subscriber → shows 404
- [ ] Unauthenticated access → redirects to /signin

## 6. Cross-Story Checks

- [ ] Sidebar + content area layout works on desktop (side by side)
- [ ] Sidebar + content area works on mobile (overlay)
- [ ] All pages use consistent design tokens (green accent, card borders, typography)
- [ ] No console errors in browser dev tools
- [ ] No broken images or icons
