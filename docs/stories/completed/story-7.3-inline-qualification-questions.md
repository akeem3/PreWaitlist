---
id: epic7.story03
epic: epic-7-public-waitlist-page
title: Inline Qualification Questions
status: done
depends_on: [epic7.story00]
updated: 2026-08-17
---

# Story 7.3 — Inline Qualification Questions

**Status:** done
**Design Refs:** — (no high-fidelity SVG for qual questions yet)

**Story:** As a founder, I want to display optional qualification questions on my public waitlist page so that I can learn more about my subscribers before launch.

## Acceptance Criteria (EARS)

- AC1: The system shall fetch qualification questions for the waitlist from the `qualification_questions` table (where `waitlist_id` matches, ordered by `sort_order` ascending) and display them inline on the signup form, below the email field.
- AC2: Each question shall render as a text input (`<input type="text">`).
- AC3: Only `free_text` question type is supported — `multiple_choice` is excluded from public page scope.
- AC4: Questions marked as optional (not required) shall display `"(optional)"` label in the design system's secondary text color (`text-muted-foreground`).
- AC5: The system shall enforce tier-based question caps: Free tier = max 2 questions, Pro tier = max 5. The cap is read from the founder's `tier` field (via `founder_profiles.tier`), not hardcoded. Growth tier is out of scope for MVP.
- AC6: The system shall collect answers as a JSON object `{ "question_id": "answer_text" }` and include it in the `POST /api/subscribers` request body as `qual_answers`.
- AC7: The system shall not require answers to optional questions — empty optional questions are excluded from `qual_answers`.
- AC8: The system shall pass `qual_answers` through to the subscriber record, stored in the `qual_answers` jsonb column.
- AC9: Lint and build shall pass with zero errors.

> **AC6 gap fixed in Epic 14 (story 14.4, 2026-09-25):** The audit (`docs/scans/engine-audit-5-engines.md` §1) flagged AC6 as unmet — answers were originally written with text keys. Epic 14 (14.0 AC11 / 14.1) now sanitizes `qual_answers` keys against configured question IDs server-side and drops unknown keys; no production path writes text-keyed answers anymore. Verified by `src/__tests__/api/subscribers.test.ts` ("drops unknown qual_answers keys").

## Tasks

- T1 (AC1-AC3): Fetch and render questions as text inputs (free_text only)
- T2 (AC4): Optional indicator styling
- T3 (AC5): Tier-based question cap enforcement
- T4 (AC6-AC8): Collect answers and pass to API
- T5 (AC9): Lint + build verification

## Out of scope

Question configuration UI (Sprint 1 onboarding Step 4a — complete), email sending (Epic 11), question CRUD API (not needed — questions are managed via onboarding).

## Dev Notes

### T1 — Fetch and Render Questions

Questions are fetched in the parent page component (Story 7.1 T1) and passed as props. The `EmailCaptureForm` component (Story 7.2) receives them and renders below the email field.

**Question data shape (from `qualification_questions` table):**

```ts
interface QualificationQuestion {
  id: string;
  question_text: string;
  question_type: "free_text"; // only free_text supported on public page
  sort_order: number;
}
```

**Note:** Only `free_text` questions are supported on the public page. The `multiple_choice` type is excluded — all qualification questions render as text inputs.

**Rendering:**

```tsx
{
  questions.map((q) => (
    <div key={q.id}>
      <label className="text-label text-foreground">{q.question_text}</label>
      {q.question_type === "free_text" ? (
        <Input
          type="text"
          placeholder={q.question_text}
          value={answers[q.id] || ""}
          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
        />
      ) : (
        <select
          value={answers[q.id] || ""}
          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
          className="..."
        >
          <option value="">Select...</option>
          {/* options from question config */}
        </select>
      )}
    </div>
  ));
}
```

### T2 — Optional Indicator

```tsx
<label className="text-label text-foreground">
  {q.question_text}
  {!q.required && (
    <span className="text-caption text-muted-foreground ml-1">(optional)</span>
  )}
</label>
```

**Note:** The `qualification_questions` table does not have a `required` column. Per the story, optional questions are those not marked as required. Since the schema only has `question_text`, `question_type`, and `sort_order`, we need to check if a `required` column exists or if all questions are treated as optional on the public page. The onboarding Step 4a allows founders to mark questions as required/optional — this maps to a column that may need to be added to the schema.

**Decision:** For Sprint 2, assume all qualification questions are optional on the public page unless the schema has a `required` boolean column. If the column doesn't exist, skip the optional indicator. Flag this if the column is missing.

### T3 — Tier-Based Question Cap

```ts
const MAX_QUESTIONS: Record<string, number> = {
  free: 2,
  pro: 5,
  growth: Infinity,
};

const visibleQuestions = questions.slice(0, MAX_QUESTIONS[tier] || 2);
```

**Cap enforcement:** Only render the first N questions based on tier. The onboarding Step 4a already enforces this when creating questions, but the public page should also enforce it as a defense-in-depth measure.

### T4 — Collect Answers

**Updated `POST /api/subscribers` body:**

```ts
{
  waitlist_id: string,
  email: string,
  referrer_id?: string,
  qual_answers?: Record<string, string>  // NEW
}
```

**Filter out empty answers:**

```ts
const qualAnswers = Object.fromEntries(
  Object.entries(answers).filter(([, value]) => value.trim() !== "")
);
```

Only include `qual_answers` in the request body if it has entries.

**Update the API route** (Story 7.0 T2) to accept and store `qual_answers`:

```ts
const { data, error } = await supabase
  .from("subscribers")
  .insert({
    waitlist_id,
    email,
    referral_code: generateReferralCode(),
    position,
    referrer_id: referrerId || null,
    qual_answers: Object.keys(qualAnswers).length > 0 ? qualAnswers : null,
  })
  .select("id, email, referral_code, position")
  .single();
```

### T5 — Lint + Build

Run `pnpm lint` and `pnpm build`.

**Files modified:**

- `components/public/email-capture-form.tsx` (add question rendering)
- `src/app/api/subscribers/route.ts` (add qual_answers handling)

**Available components:** `Input` ✓, `Button` ✓, `Spinner` ✓
**Available utilities:** `cn()` ✓
