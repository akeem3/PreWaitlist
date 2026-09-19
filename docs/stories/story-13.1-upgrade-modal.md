# Story 13.1 — Upgrade Modal (7 Triggers)

**Status:** ready
**Epic:** 13 — Billing & Feature Gating

## Story

As a free founder, I want to see a context-sensitive upgrade modal when I hit a feature limit so that I understand what I'm missing and how to get it.

## Acceptance Criteria (EARS)

- AC1: The system shall provide an `UpgradeModal` component at `components/dashboard/upgrade-modal.tsx`.
- AC2: The modal shall accept props: `open`, `onOpenChange`, `triggerSource` (string), and use `usePaddle()` to open checkout.
- AC3: The modal shall display a context-specific headline based on `triggerSource`.
- AC4: The modal shall show 3-5 Pro feature bullet points, price ("$15/mo"), and "Cancel anytime".
- AC5: One primary CTA ("Upgrade to Pro") that opens Paddle overlay checkout with `customData: { trigger_source }`.
- AC6: Dismissable via X button, "Maybe later", or backdrop click.
- AC7: Design system: bg-card, border-border, centered overlay with backdrop blur, max-w-[480px].
- AC8: After dismissal, same trigger suppressed for 7 days (localStorage cooldown).
- AC9: Triggered at 7 context points: (1) sidebar Broadcast click, (2) sidebar Warmth click, (3) subscriber approaching 500 cap, (4) 3rd qual question attempt, (5) settings billing CTA, (6) CSV export attempt, (7) dashboard first-subscriber window.
- AC10: Lint and build shall pass with zero errors.

## Tasks

T1 (AC1-AC7) Build modal component with Paddle checkout integration
T2 (AC8) localStorage cooldown logic
T3 (AC9) Wire 7 trigger points
T4 (AC10) Lint + build

## Dev Notes

- Modal UX: show short interstitial before opening Paddle checkout. Modal IS the pricing comparison.
- Contextual triggers (feature gate clicks, limits) convert better than ambient ones.
- Cooldown: `localStorage.setItem("upgrade-dismissed-{trigger}", JSON.stringify({ dismissedAt: Date.now() }))`. Check: if < 7 days since dismiss, don't show.
- Trigger content varies by source but shares same CTA and feature list.
- Design: max-w-[480px], backdrop backdrop-blur-sm bg-black/50, focus trap, Escape dismisses.
- Sidebar already shows locked state for Broadcast and Warmth — wire those click handlers to open modal instead of just tooltip.

## Files to Create/Modify

- `components/dashboard/upgrade-modal.tsx` — new component
- `components/dashboard/sidebar.tsx` — wire Broadcast + Warmth click to modal
- `src/app/dashboard/page.tsx` — wire subscriber approaching cap
- `src/app/onboarding/4a/page.tsx` — wire 3rd qual question
- `src/app/dashboard/settings/profile/client.tsx` — wire billing CTA
- `src/app/dashboard/client.tsx` — wire CSV export + first-subscriber
