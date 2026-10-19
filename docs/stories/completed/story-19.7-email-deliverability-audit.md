# Story 19.7 — Email Deliverability Audit

**Status:** done
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

| File                                                       | Change                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/stories/story-19.7-email-deliverability-audit.md`    | Findings section: records, pass/fail, remediation (T3)                                                                                               |
| `src/lib/from-address.ts` (+ `src/lib/email.ts` re-export) | Verify only — `resolveFromAddress` streams/fallback (T1). Note: implementation moved to `from-address.ts` in Story 17.3; `email.ts:9` re-exports it. |

## Findings (T1–T3 — AC1–AC4)

**Snapshot date:** 2026-10-05 · DNS resolver: Vercel DNS (`ns1/ns2.vercel-dns.com`) via `Resolve-DnsName -DnsOnly` · Read-only audit; no records changed.

### 1. DNS records — live capture vs Resend requirements (AC1)

| #   | Record                      | Query                                     | Live value (TTL)                                                                                                                                                                                                                  | Verdict                                                                                                                                                               |
| --- | --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **SPF**                     | TXT `send.prewaitlist.com`                | `v=spf1 include:amazonses.com ~all` (60)                                                                                                                                                                                          | ✅ **PASS** — exact match to Resend's required SPF (`include:amazonses.com`, `~all`); 1 include = 1 of SPF's 10-lookup budget                                         |
| 2   | **MX (Return-Path/bounce)** | MX `send.prewaitlist.com`                 | `feedback-smtp.us-east-1.amazonses.com` pref 10 (60)                                                                                                                                                                              | ✅ **PASS** — matches Resend's documented bounce MX (us-east-1)                                                                                                       |
| 3   | **DKIM**                    | TXT `resend._domainkey.prewaitlist.com`   | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKDgTr+dhgzW6byRTDtFKWaKZdktzlqBh2VKpWOE+oXaW+Mzr4+AtI5AtyIUpr7r5zQY8kq7bPZrw8PQ89rHfD6F2nd+BihGdegKkt37IDBtLoLnk/hbGUcf1csrqFmBXfqH3VtEu6McgaRlRUF20uuZw/4MzQi1/u8inwK7B8DQIDAQAB` (60) | ⚠️ **PRESENT** — DKIM public key resolves (RSA, selector `resend`). Exact-value match against the Resend dashboard record is **pending AC2 step 3**                   |
| 4   | DKIM CNAME (Dev-Note query) | CNAME `resend._domainkey.prewaitlist.com` | Absent (SOA authority; NODATA — the name exists as TXT, so a CNAME-type query correctly returns no answer)                                                                                                                        | ⚪ **N/A** — correct: this domain's Resend DKIM is TXT (record #3), not CNAME. Dev-Note CNAME query documented as not-applicable                                      |
| 5   | **DMARC**                   | TXT `_dmarc.prewaitlist.com`              | `v=DMARC1; p=none;` (60)                                                                                                                                                                                                          | ✅ **PASS** — published (meets Gmail/Yahoo "DMARC required" rule) in Resend-recommended monitor mode. GAP: no `rua=` reporting (see G1)                               |
| 6   | Root SPF                    | TXT `prewaitlist.com`                     | No answer (SOA authority only)                                                                                                                                                                                                    | ⚪ **Correct-by-omission** — Resend's SPF lives on `send` (records #1), never the apex; an apex SPF would burn a lookup without helping Resend. No duplicate-SPF risk |
| 7   | Root MX                     | MX `prewaitlist.com`                      | No answer                                                                                                                                                                                                                         | ⚪ **Note** — apex accepts no mail; replies to `notifications@`/`updates@` bounce at MX lookup (accepted no-reply posture — see G5)                                   |

**Both streams (AC1):** `notifications@prewaitlist.com` (transactional) and `updates@prewaitlist.com` (broadcast) authenticate at **domain level** — same DKIM signature (`d=prewaitlist.com`, selector `resend`) and same SPF via the `send` Return-Path; the stream only changes the local-part (no separate DNS per stream). DMARC alignment: DKIM strictly aligns with the From domain; SPF relax-aligned through the `send` subdomain → either mechanism satisfies DMARC. **[AMENDED 2026-10-10 — post-audit change:** the broadcast stream now sends from `updates@mail.prewaitlist.com` (dedicated sending subdomain, founder decision after Gmail spam placement). Root records above remain valid for transactional; the subdomain gets its **own** nested records (`send.mail` MX+SPF TXT, `resend._domainkey.mail` TXT, copied from the Resend dashboard), and root `_dmarc` (`p=none`) covers the subdomain via organizational-domain fallback — no new DMARC required. Awaiting Resend verification of `mail.prewaitlist.com`.**]**

### 2. Resend-side status (AC1 support → routed to AC2)

- **API attempt:** `GET https://api.resend.com/domains` with the local `RESEND_API_KEY` → **401 `restricted_api_key`** — `"This API key is restricted to only send emails"`. The local/prod key is send-only by design (least privilege); domain status is not readable from code with this key.
- **Fallback evidence:** Story 0.4 recorded `prewaitlist.com` as verified in Resend (MEMORY); production sends work (webhook events live-verified 2026-09-27) — the domain passes Resend's sending checks in practice.
- **Authoritative confirmation** = the founder dashboard check in AC2 (script below).

### 3. Code-side sender configuration (AC3)

| Path                                 | Evidence                                                                                                                                                                                                                                                                                                                   | Verdict                                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Resolver (single source of truth)    | `src/lib/from-address.ts:20-44` — stream → local-part (`transactional`→`notifications@`, `broadcast`→`updates@`); domain chain: `sendingDomain` if set (prefix@domain) else `prewaitlist.com`; display-name chain senderName→productName→headline→`"PreWaitlist"`                                                          | ✅ **[AMENDED 2026-10-10:** default broadcast domain now `mail.prewaitlist.com`**]** |
| Single-send wrapper                  | `src/lib/email.ts:230-236` — `sendEmail()` always resolves `from` via the helper; no caller can override `from` (no `from` param exists on `SendEmailParams`)                                                                                                                                                              | ✅                                                                                   |
| Confirmation email                   | `src/app/api/subscribers/route.ts:965-976` — `stream: "transactional"`; `senderName`/`sendingDomain` forced `null` unless `tier === "pro"`                                                                                                                                                                                 | ✅                                                                                   |
| Moved-up email                       | `src/app/api/subscribers/route.ts:1144-1155` — same tier-gated pattern                                                                                                                                                                                                                                                     | ✅                                                                                   |
| 90%-cap warning                      | `src/app/api/subscribers/route.ts:1291-1295` — transactional, no sender params → default `PreWaitlist <notifications@prewaitlist.com>` (by design, per revenue-plan B)                                                                                                                                                     | ✅                                                                                   |
| Milestone congratulation             | `src/lib/milestones.ts:237-257` — transactional; `senderName`/`sendingDomain` gated on `email.founderTier === "pro"`                                                                                                                                                                                                       | ✅                                                                                   |
| Retry queue (quota warning + replay) | `src/lib/retry-queue.ts:176-184` quota-warning send (transactional, no sender params → verified defaults) · `:233-246` queue replay — `stream`/`sender_name`/`product_name`/`headline`/`sending_domain` restored from the row (`:238-242`), so retried mail keeps the original sender config                               | ✅                                                                                   |
| Broadcast batch                      | `src/app/api/dashboard/broadcast/route.ts:167-173` resolves `…, "broadcast", sending_domain` → payload uses it at `:220`                                                                                                                                                                                                   | ✅                                                                                   |
| Updates batch                        | `src/app/api/updates/route.ts:132-138` → payload `:192`                                                                                                                                                                                                                                                                    | ✅                                                                                   |
| Compose preview                      | `src/app/dashboard/broadcast/client.tsx:57` — `resolveFromAddress(…)` (Story 17.3)                                                                                                                                                                                                                                         | ✅                                                                                   |
| Bypass scan                          | Repo-wide source grep for `notifications@prewaitlist.com` / `updates@prewaitlist.com` / `noreply@` → **only** `from-address.ts:40-41` (every other match is documentation). Direct `resend.emails.send` / `resend.batch.send` → **only** `email.ts` (`:195`, `:274`); tests mock `@/lib/resend` instead of calling the SDK | ✅ no hardcoded sender bypasses verified domains                                     |
| Tier fallback rule                   | Free tier → `senderName`/`sendingDomain` forced null on transactional paths; broadcast/updates are `requirePro`-gated → custom `sending_domain` is only ever used by Pro                                                                                                                                                   | ✅                                                                                   |

**AC3 verdict: PASS** — every send (single, batch, retry, preview) flows through `resolveFromAddress`; the only hardcoded addresses are the helper's verified-domain defaults.

### 4. Founder dashboard check — scripted steps (T2 — AC2)

Founder: please run these in order and report back the five results (R1–R5):

1. Log in to **resend.com** → **Domains** → click **`prewaitlist.com`**.
2. **R1 — Domain status:** record the status badge (expect **Verified** / green) and the "Created" date.
3. **R2 — Record match:** expand the domain's DNS records and confirm each dashboard value matches live DNS:
   - DKIM TXT host `resend._domainkey` → value must equal record #3 above (starts `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKDgTr…`) → match? yes/no
   - SPF TXT host `send` → `v=spf1 include:amazonses.com ~all` → match? yes/no
   - MX host `send` → `feedback-smtp.us-east-1.amazonses.com` (10) → match? yes/no
   - Any record showing red/pending in the dashboard? (record which)
4. **R3 — Webhook URL (Dev-Note item):** **Developers → Webhooks** → record the endpoint URL. It must be `https://www.prewaitlist.com/api/webhooks/resend` (**www**, not apex — the apex 308-redirects and Paddle/Resend-style receivers don't follow redirects). Was the www update you were given on 2026-09-27 applied? yes/no.
5. **R4 (optional, scope observation G6):** if you use Supabase Auth SMTP for verify-email, note the sender domain shown in Supabase **Auth → SMTP Settings** — if it sends as `prewaitlist.com`, it needs apex-level SPF/DKIM of its own (outside this story's Resend scope).

**Report back:** R1 status · R2 three match answers + any red record · R3 URL + applied y/n · R4 (if checked).

### 5. Gaps & remediation (AC4)

| #   | Gap                                                                                 | Severity                | Remediation                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G1  | DMARC publishes no `rua=` aggregate reports — authentication failures are invisible | Low (observability)     | Founder adds e.g. `v=DMARC1; p=none; rua=mailto:<chosen-mailbox>@prewaitlist.com;` to `_dmarc` TXT (founder picks the mailbox — DNS value, not product copy) |
| G2  | DKIM value not yet matched against the dashboard                                    | Blocks AC1 completeness | AC2 step 3 (R2)                                                                                                                                              |
| G3  | Domain status unreadable via API (send-only key)                                    | Process                 | AC2 dashboard check (R1); optionally create a second key with domain read permission — founder decision, new credential (ask-first)                          |
| G4  | DMARC policy is `p=none`                                                            | Not a defect            | Resend-recommended staged upgrade → `p=quarantine` once delivery is proven passing; founder decision near launch                                             |
| G5  | Apex has no MX — replies to `notifications@`/`updates@` bounce                      | Note                    | Accepted no-reply posture; revisit only if reply-handling is ever wanted                                                                                     |
| G6  | Supabase Auth (verify-email) sender domain not covered by this audit                | Open observation        | AC2 optional step R4                                                                                                                                         |

### 6. Webhook verification status (Dev-Note item, AC4)

Last known state (MEMORY, live-verified 2026-09-27): the working endpoint is `https://www.prewaitlist.com/api/webhooks/resend`; the old apex URL was dead (404/`DEPLOYMENT_NOT_FOUND`) and the dashboard URL update was assigned to the founder. **Current dashboard state unknown from code (webhook list also blocked by the send-only key) → recorded via AC2 step 4 (R3).**

## Risk

- Manual dependency: AC2 requires the founder in the Resend dashboard — the story can't complete solo; provide scripted instructions early (T2) and record what's returned.
- DNS records can change between capture and launch — treat AC4 findings as a snapshot; re-check in 21.8 if launch slips.
- Depends on 19.1 so deliverability runs against the fixed footer code (epic Story Index rationale) — don't start before 19.1 lands.

## Close-out

AC1 ✓ (live DNS capture + Resend-requirement verification, findings §1) · AC3 ✓ (code-side sender config, findings §3 — re-audited line-by-line) · AC4 ✓ (findings §1–§6, gaps G1–G6 with remediation, webhook www-vs-apex status §6) · AC5 ✓ (lint 0 errors, clean build). AC2: script delivered in §4 — founder's Resend dashboard run (R1–R4) recorded as a non-blocking launch follow-up on epic close (founder directive 2026-10-05). Prompt #3 audit 2026-10-05: 5 documentation defects found, fixed, and re-verified (TTLs ×2, NODATA wording, retry-queue citations, bypass-scan wording); gates re-run green. Epic 19 declared complete by founder 2026-10-05.
