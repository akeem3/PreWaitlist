# Story 19.7 — Email Deliverability Audit

**Status:** ready
**Epic:** 19 — Product Fixes & Polish
**Depends on:** 19.1
**Design Refs:** - (no new UI; fixes/audits/docs only)
**Source:** [Epic 19 Story 19.7](../epics/epic-19-product-fixes-polish.md)

## Story

As the maintainer, I want SPF/DKIM/DMARC for our sending domains verified so that launch emails land in inboxes.

## Acceptance Criteria (EARS)

- AC1: DNS records for `prewaitlist.com` (SPF, DKIM, DMARC) shall be captured and verified against Resend's requirements for both `notifications@` and `updates@` streams.
- AC2: The founder shall complete the Resend dashboard domain-status check (Verified) — story provides the exact steps and records what's returned.
- AC3: Code-side sender configuration shall be verified: `resolveFromAddress` streams, `sending_domain` fallback, no hardcoded sender that bypasses verified domains.
- AC4: A findings section shall document: record values, pass/fail per record, any gaps, and remediation steps.
- AC5: Lint and build shall pass with zero errors.

## Tasks

- T1 (AC1, AC3) DNS + code verification
- T2 (AC2) Founder Resend-dashboard step (scripted instructions)
- T3 (AC4) Findings doc
- T4 (AC5) Lint + build

## Out of Scope

- Founder custom-domain auth UI; changing sending-domain architecture.

## Dev Notes

- Vision `:435`: "SPF/DKIM on tool's own sending domain confirmed". Domain `prewaitlist.com` was verified in Resend during Story 0.4 — this is re-confirmation + record capture, not initial setup.
- DNS queries: `Resolve-DnsName -Type TXT prewaitlist.com`, `-Type CNAME resend._domainkey.prewaitlist.com`, `-Type TXT _dmarc.prewaitlist.com` (founder runs against live DNS; record output in findings).
- Custom sending domains for founders (Story 13.5 wizard) are out of scope here — audit covers the tool's own domains only.
- Found during MEMORY scan: founder-run Resend webhook URL update (www vs apex) is tracked separately — include its verification status in AC4 findings while in the Resend dashboard.

## Files to Create/Modify

| File                                                    | Change                                                   |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `docs/stories/story-19.7-email-deliverability-audit.md` | Findings section: records, pass/fail, remediation (T3)   |
| `src/lib/email.ts`                                      | Verify only — `resolveFromAddress` streams/fallback (T1) |

## Risk

- Manual dependency: AC2 requires the founder in the Resend dashboard — the story can't complete solo; provide scripted instructions early (T2) and record what's returned.
- DNS records can change between capture and launch — treat AC4 findings as a snapshot; re-check in 21.8 if launch slips.
- Depends on 19.1 so deliverability runs against the fixed footer code (epic Story Index rationale) — don't start before 19.1 lands.
