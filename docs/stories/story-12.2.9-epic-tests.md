# Story 12.2.9 — Epic 12.2 Tests

**Epic:** 12.2 — Gap Fixes
**Status:** ready
**Depends on:** 12.2.0–12.2.8
**Design Refs:** — (no UI)

## Story

As the founder, I want comprehensive tests covering every Epic 12.2 component and page so that gap fixes are regression-proof and production-ready.

## Test Infrastructure

Vitest + @testing-library/react for component tests. Config: `vitest.config.mts`. Test location: `src/__tests__/`.

## Acceptance Criteria (EARS)

- AC1: The system shall have component tests for archive waitlist covering: renders archive button, confirmation dialog triggers API call, archived banner displays, unarchive works.
- AC2: The system shall have component tests for edit after onboarding covering: editable fields render, save buttons trigger API, success/error feedback displays, live preview updates.
- AC3: The system shall have component tests for consent tracking covering: checkbox renders, required validation, consent captured in submission.
- AC4: The system shall have component tests for unsubscribe page covering: renders confirmation message, resubscribe option works.
- AC5: The system shall have API route tests for unsubscribe covering: verifies HMAC token, updates subscriber, rejects invalid token.
- AC6: The system shall have API route tests for bounce handling covering: inserts bounce record, skips bounced emails, soft bounce retry after 24h.
- AC7: The system shall have component tests for settings covering: business address field renders, error handling on save.
- AC8: All tests shall pass with `pnpm test`.
- AC9: Lint and build shall pass with zero errors.
- AC10: Total test count across the project shall be ≥280.

## Tasks

T1 (AC1) Archive tests · T2 (AC2) Edit tests · T3 (AC3) Consent tests · T4 (AC4-AC5) Unsubscribe tests · T5 (AC6) Bounce tests · T6 (AC7) Settings tests · T7 (AC8-AC10) Full verification

## Out of Scope

E2E tests, legal page content tests (static pages), visual regression tests.

## Implementation Details

### T1: Archive tests

- **New file:** `src/__tests__/components/dashboard-archive.test.tsx`

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

describe("Archive Waitlist", () => {
  it("renders archive button in danger zone", () => {
    // Render settings component with archive section
    expect(screen.getByText("Archive Waitlist")).toBeDefined();
    expect(screen.getByText("Danger Zone")).toBeDefined();
  });

  it("shows confirmation dialog on archive click", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByText("Archive Waitlist"));
    expect(confirmSpy).toHaveBeenCalledWith(
      "Archiving your waitlist will stop new signups and hide your public page. This can be undone. Continue?"
    );
  });

  it("calls API on confirmed archive", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
    fireEvent.click(screen.getByText("Archive Waitlist"));
    expect(fetchSpy).toHaveBeenCalled();
  });
});
```

### T2: Edit tests

- **New file:** `src/__tests__/components/dashboard-edit-after-onboarding.test.tsx`

- Renders editable fields for headline, subheadline, CTA, brand color, logo, sender name
- Each field has its own Save button
- Save triggers PATCH /api/waitlist
- Success shows "Saved!" for 3 seconds
- Error shows error message below field

### T3: Consent tests

- **New file:** `src/__tests__/components/consent-checkbox.test.tsx`

- Renders checkbox with consent text
- Checkbox is unchecked by default
- Submit without consent shows error
- Submit with consent proceeds

### T4: Unsubscribe tests

- **New file:** `src/__tests__/components/unsubscribe-page.test.tsx`

```typescript
describe("Unsubscribe Page", () => {
  it("renders confirmation message", () => {
    // Mock Supabase response
    render(<UnsubscribePage subscriberId="123" waitlistName="Test Waitlist" />);
    expect(screen.getByText("Unsubscribed")).toBeDefined();
    expect(screen.getByText(/You have been unsubscribed from Test Waitlist/)).toBeDefined();
  });

  it("renders resubscribe link", () => {
    render(<UnsubscribePage subscriberId="123" waitlistName="Test" />);
    expect(screen.getByText("Changed your mind? Resubscribe")).toBeDefined();
  });
});
```

- **New file:** `src/__tests__/api/unsubscribe.test.tsx`

- Valid HMAC → subscriber unsubscribed
- Invalid HMAC → 400 error
- Missing token → 400 error

### T5: Bounce tests

- **New file:** `src/__tests__/lib/bounces.test.tsx`

```typescript
describe("isEmailBounced", () => {
  it("returns false when no bounce record", async () => {
    // Mock Supabase returning null
    expect(await isEmailBounced(mockSupabase, "wl-1", "test@example.com")).toBe(
      false
    );
  });

  it("returns true for hard bounce", async () => {
    // Mock Supabase returning hard bounce record
    expect(await isEmailBounced(mockSupabase, "wl-1", "test@example.com")).toBe(
      true
    );
  });

  it("returns true for soft bounce within 24h", async () => {
    // Mock recent soft bounce
    expect(await isEmailBounced(mockSupabase, "wl-1", "test@example.com")).toBe(
      true
    );
  });

  it("returns false for soft bounce after 24h", async () => {
    // Mock old soft bounce
    expect(await isEmailBounced(mockSupabase, "wl-1", "test@example.com")).toBe(
      false
    );
  });
});
```

### T6: Settings tests

- **New file:** `src/__tests__/components/dashboard-settings-business-address.test.tsx`

- Renders business address input
- Save triggers PATCH /api/waitlist
- Error handling on save

### T7: Full verification

Run all checks:

```bash
pnpm test
pnpm lint
pnpm build
```

Verify ≥280 tests pass.

## Verification

1. All new test files created in `src/__tests__/`
2. `pnpm test` — all tests pass (≥280 total)
3. `pnpm lint` — zero errors
4. `pnpm build` — zero errors
5. Test coverage for all 10 stories in Epic 12.2
