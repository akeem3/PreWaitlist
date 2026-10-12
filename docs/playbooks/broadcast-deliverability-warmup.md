# Broadcast Deliverability — Verification & Subdomain Warm-Up Playbook

**Audience:** founder (solo operator) · **Status:** active · **Created:** 2026-10-11
**Source:** Prompt #8 investigation "broadcast lands in Spam/Promotions"

Internal reference — why the first bulk send from `updates@mail.prewaitlist.com` landed in Gmail Spam (then Promotions after "Report not spam"), how to verify the pipeline is healthy, and how to warm the new sending subdomain. Not product UI copy.

---

## 1. Root Cause (settled — do not re-investigate)

| Question                       | Answer                                                                                                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication broken?         | **No.** SPF/DKIM/DMARC records on `mail.prewaitlist.com` are Resend-issued and valid                                                                            | `send.mail.prewaitlist.com` → CNAME `send.forge.rmta.net` (`forge.rmta.net` = Resend Forge, Resend's own MTA); DKIM `resend._domainkey.mail…` present; root `_dmarc` `p=none` org-domain fallback covers the subdomain                                                                                                                                                                         |
| Actual cause                   | **Cold-subdomain reputation + Gmail content classification**                                                                                                    | Brand-new sending domain (verified 2026-10-10, first bulk send 2026-10-11) starts with zero reputation. Google sender guidelines: increase volume slowly — _"a new domain sending at full volume immediately will land in spam regardless of authentication."_ After "Report not spam", Gmail's separate **category** classifier files legitimate marketing into **Promotions** (not a defect) |
| Why segregation matters anyway | Root `prewaitlist.com` has prior broadcast history; the `mail.` subdomain isolates **bulk** reputation from **transactional** (`notifications@prewaitlist.com`) | Decision `b715d6b` / MEMORY "Sending-subdomain segregation"                                                                                                                                                                                                                                                                                                                                    |
| Caveat                         | Gmail also evaluates the **organizational domain** — root history can still weigh in, so warm-up is required regardless                                         | Gmail bulk requirements count toward the primary domain                                                                                                                                                                                                                                                                                                                                        |

**What is already correct (no code change needed):** RFC 8058 one-click unsubscribe headers · CAN-SPAM physical address · multipart text part · unsubscribe link in HTML footer · bounce/unsub suppression at send time · TLS + Resend-owned PTR.

### Round-2 follow-up (2026-10-11) — "the other senders work" comparison

The founder's question: confirmation emails and founder updates land in inbox — broadcasts don't. What ingredient is missing?

**Answer: none, in the current code.** A read-only line-by-line comparison of the three send paths found the current broadcast payload is structurally identical to the updates payload (same shell, From, headers, text part, footer — empirically diffed). Two historical findings close the loop:

1. **Root-domain era (pre-2026-10-10):** the broadcast route shipped HTML-only payloads — no `text` part at all (git `4ad223c^`) — which SpamAssassin scores as `MIME_HTML_ONLY` (~+1.5). Updates always had a text part → inboxed on the same From. That was the real "missing ingredient"; it was fixed by `4ad223c` (shared shell + text part) + `b715d6b` (subdomain segregation).
2. **New-subdomain era (now):** the only two messages ever sent from `updates@mail.prewaitlist.com` were **broadcasts**. The "updates work" evidence predates the cutover — the test update ("Testing the update") was sent 2026-10-10 12:43Z, ~3 hours before the segregation deploy went live on production (merge `bdce783`, 15:39+01). It went from the **root** `updates@prewaitlist.com`. The new subdomain has never received a test update — the control experiment was never run. **Decisive check:** Gmail → the spam broadcast → ⋮ → _Show original_ → look at the From domain (see V1).

**Code hardening shipped this day (broadcast route only):** plain-text bodies were rendered as an unstyled bare text node in the shell (newlines collapsed to one run-on line). Now wrapped in an escaped `<p style="… white-space: pre-wrap;">` — byte-parity with the updates sender — and HTML bodies get the same base typography on a wrapper `<div>`. Regression-locked by `broadcast.test.ts` (2 new tests).

**Control experiment (founder, 2 minutes):** send a tiny founder update now — it will go from `updates@mail.prewaitlist.com` (the same new subdomain). If it also lands in Spam → cold-domain placement confirmed, nothing code-side is wrong, proceed to §3–§4 warm-up. If it inboxes while the broadcast still spams → re-open this investigation (would indicate content/subject/CTA-link classification, not the pipe).

### Round-3 follow-up (2026-10-11) — control experiment result: broadcast → Promotions, update → Primary

The control ran. Same From address (`updates@mail.prewaitlist.com`), same subdomain, same day — update landed Primary, broadcast landed Promotions. Spam is solved (warm-up + the round-2 fix worked). Remaining question: why the tab split?

**Answer: Gmail's per-message content classifier. Not the pipe.** Google's own documentation: tab sorting weighs _who the email comes from, what type of content is in the message, and how users have interacted with similar content_ — with **recipient interaction the strongest signal**. The pipe was empirically proven identical in round 2 (shell, From, headers, text part, footer, tags all match). The only remaining deltas are message content:

| Signal          | Update                                                   | Broadcast                                                        | Classifier read                              |
| --------------- | -------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Subject         | `Update from {name}` — "update" = operational vocabulary | founder free text (launch/marketing phrasing scores promotional) | strongest content signal                     |
| Body            | short plain-text note                                    | longer founder-authored marketing copy                           | content type                                 |
| CTA destination | always `{subdomain}.prewaitlist.com` (in-family)         | optional **off-domain** URL                                      | off-domain CTA = classic promotional pattern |
| Everything else | identical                                                | identical                                                        | —                                            |

**Facts worth keeping (researched 2026-10-11, Google + 4 deliverability sources):**

1. **Promotions is the inbox.** Delivered, authenticated, visible, notifies. Tab placement ≠ deliverability failure. Deliverability failure looks like Spam/rejection — that battle is won.
2. **No sender can guarantee Primary.** Category is per sender–recipient pair; the same message can land in different tabs for different people.
3. **Strongest lever = recipient action (you control it, one time per recipient):** drag the broadcast → Primary → accept _"Do this for future messages?"_. Google documents this creates a persistent preference **for that sender** — and since both streams share the identical From address, training once on a broadcast trains all future broadcasts for that person. Add to Contacts + a category filter are the supporting moves (§3).
4. **Subject vocabulary is the strongest content lever** (founder writes it — not a code surface): "update / briefing / note" style reads operational; "launch / offer / deal / free / % off" style reads promotional.
5. **Do NOT** strip the unsubscribe link/headers to chase Primary — required for bulk mail (RFC 8058 / Google policy); the spam button is the one signal that genuinely hurts.
6. Warm-up still applies — domain reputation is still days old; content-classifier drift toward Primary typically needs a few clean send cycles plus engagement.

### Round-4 follow-up (2026-10-11) — byte-level diff + deeper research (founder: "don't speculate")

Founder pushback on round 3: drag-to-primary doesn't scale to 100s of recipients; updates "used to end up in promotions" and were fixed — so placement is not guesswork. Two bodies of evidence produced:

**A. Byte-level diff (hard facts, not theory).** Both emails rendered through the real modules (`buildEmailShell` + route-identical inputs) and diffed. Exactly **3 substantive deltas**, everything else byte-identical:

| #   | Delta         | Update (Primary)                                                                       | Broadcast (Promotions)                                                        | Note                                                                             |
| --- | ------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Subject/title | `Update from Quality`                                                                  | founder free text (`Testing broadcast 6` etc.)                                | strongest content signal per all sources                                         |
| 2   | CTA button    | always present, in-family URL (`{subdomain}.prewaitlist.com`, label "See all updates") | absent in founder's tests (no `cta_url` set)                                  | paradox: the email WITH the styled button won Primary — button is not the driver |
| 3   | Body wrapper  | `<p style="…pre-wrap;">`                                                               | bare text node on prod (round-2 wrap fix uncommitted/undeployed at test time) | closes on deploy of the round-2 fix                                              |

Footers, From, headers (List-Unsubscribe(-Post)), text part, shell chrome, tags — all identical (proven in round 2, re-confirmed here). Broadcast body/CTA at test time not recoverable from DB (`broadcasts` stores subject/recipient_count/sent_at only).

**B. Research (6 sources, 2026-10-11: Warmy research report, Suped, smtping, mailertogo, Litmus, Mailgun).** Concrete Promotions-classifier signals, ranked by consistency across sources:

1. **Recipient interaction history — strongest, and per sender–recipient pair.** Google documents drag-to-Primary + "always do this" creates a persistent preference; engagement patterns feed the same model. **This is the only mechanism that explains the founder's exact experience**: their mailbox trained on updates (received many, engaged/dragged) → all future updates from that From → Primary; broadcasts are brand-new to that mailbox → default classification → Promotions. It is also precisely why it "doesn't scale" — the training is one pair at a time.
2. **Subject vocabulary** ("launch/offer/deal/free/% off" → promotional; "update/briefing/note" → operational) — strongest _content_ lever, founder-written, not a code surface.
3. **CTA/link patterns** — off-domain CTA, link density, tracked URLs lean promotional; one in-family task link leans clean. (Warmy: explicit/aggressive CTA phrasing → Promotions; benefit-driven phrasing improved inbox 30% in their tests.)
4. **HTML weight** — styled buttons, nested tables, heavy templates lean promotional (Warmy: inbox declined as HTML weight rose, independent of content). Our shell is shared and light; not a differentiator between the two streams.
5. **List-Unsubscribe header + bulk volume** — unavoidable for compliant bulk mail; identical on both streams; cannot and must not be stripped (RFC 8058 / Google policy).
6. **No code-side "fix" for updates exists in git or MEMORY.** Searched: no commit moved updates out of Promotions. If the founder remembers a specific change, name it and it will be verified; otherwise the recipient-training explanation (B1) is the only one consistent with all evidence.

**Verdict (round 4):** the tab split is recipient-interaction + subject/content classification, not a structural pipe defect. Code-side actionable item: deploy the round-2 body-wrap fix (still uncommitted) to close delta #3. Everything else that moves broadcasts toward Primary for _real_ recipients = subject vocabulary (founder), body/CTA content (founder), warm-up (§4), and time+engagement — not more code.

**Testing hygiene flag:** the founder's own mailbox now has a drag-trained preference on the one broadcast they moved to Primary. Their future broadcast tests in that same mailbox may land Primary regardless of content — use a second Gmail account (or seed list) for clean comparisons going forward.

---

## 2. Verification Procedure (run once — 10 minutes)

Do these in order. Each step has a decision branch — stop and check the branch if the step fails.

### V1 — Confirm what actually left the building (Resend dashboard)

1. Resend → **Logs** → find the test broadcast.
2. Check the **From** shown on the delivered message:
   - `updates@mail.prewaitlist.com` → segregation live, proceed to V2.
   - `updates@prewaitlist.com` (old root address) → **the deploy carrying `b715d6b` wasn't live when you sent.** Redeploy, verify production build hash, resend, restart at V1. Root-domain spam history then explains the Spam placement entirely.

### V2 — Confirm Gmail authenticated it (Gmail web)

1. Open the received message (even from Spam/Promotions) → **⋮** (top right) → **Show original**.
2. In the **Authentication results** panel confirm:
   - `SPF: PASS` · `DKIM: PASS` · `DMARC: PASS`
3. Branch:
   - All PASS → authentication closed. Proceed to §3 (training) and §4 (warm-up).
   - Any FAIL → screenshot the panel. This would contradict the DNS audit; re-check `send.mail.prewaitlist.com` CNAME and `resend._domainkey.mail` TXT in Vercel DNS before anything else.

### V3 — Postmaster Tools (ongoing monitoring)

1. [postmaster.google.com](https://postmaster.google.com) → **Add a domain** → `mail.prewaitlist.com` (verify via TXT as instructed).
2. After V1 sends: watch **Spam rate** — action threshold **> 0.10%** (Gmail's hard ceiling for bulk senders is 0.30%).
3. Watch **Domain reputation** — target "High" during ramp.

---

## 3. Recipient-Side Training (each real recipient, one time)

Gmail learns per-sender from explicit user actions (Google support + Gmail help threads):

1. **Drag the message from Promotions/Spam → Primary tab.** Gmail offers _"Do this for future messages?"_ → accept. This is the single strongest signal.
2. **Add the sender to Contacts:** `updates@mail.prewaitlist.com`.
3. **Optional, stronger:** create a filter (⋮ → _Filter messages like this_ → _Create filter_) → check **Categorize it as: Primary** → Create.

Repeat for your own mailbox and any warm supporters who agreed to test.

---

## 4. Warm-Up Ramp (the actual fix — 2–4 weeks)

New subdomain = blank slate. Ramp volume, bias to engaged recipients, keep the spam rate < 0.10%.

| Phase | Duration  | Send to                                                            | Guidance                               |
| ----- | --------- | ------------------------------------------------------------------ | -------------------------------------- |
| 1     | Week 1    | Hot segment only (+ your own test recipients)                      | Small sends, ≤ ~100/day                |
| 2     | Weeks 2–3 | Hot + Warm segments                                                | Roughly double per week; skip Cold     |
| 3     | Week 4+   | Full list ("All" segment) once reputation shows High in Postmaster | Continue monitoring spam rate per send |

Rules of thumb:

- **Segmented sends beat full-list blasts during ramp** — the product already supports this (segment selector in broadcast).
- Never blast a cold segment while the domain is new; unengaged recipients are the primary spam-trap/complaint risk.
- First **transactional** sends on the root domain (`notifications@`) are unaffected by this ramp — different stream, separate reputation.
- Keep sends regular (a rhythm beats one giant spike); Gmail's accelerated-enforcement path punishes new domains that start at full volume.

---

## 5. Open Decisions (founder — not implemented; each is a scope/copy gate)

| #   | Option                                                                             | Trade-off                                                                                        | Status                           |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------- |
| D1  | Append unsubscribe URL to the multipart **text** part of broadcast/updates         | Tiny compliance hardening (URL currently only in HTML + headers); touches 2 routes + their tests | Awaiting decision                |
| D2  | First-send guardrail (e.g., warn above N recipients on a brand-new sending domain) | Prevents accidental cold-domain blasts; adds product behavior + user-facing copy                 | Awaiting decision                |
| D3  | Move DMARC `p=none` → `p=quarantine` after reputation is High                      | Strengthens alignment enforcement; DNS change, minor risk if a stream misaligns                  | Awaiting decision (Sprint later) |
| D4  | In-app deliverability hints on first broadcast                                     | Copy-gated (never write user-facing copy without approval)                                       | Awaiting decision                |

---

## 6. Success Criteria

- [ ] V1: Resend log shows From = `updates@mail.prewaitlist.com`
- [ ] V2: `Show original` → SPF/DKIM/DMARC all PASS
- [ ] V3: Postmaster shows the domain with spam rate < 0.10% and reputation climbing
- [ ] Training: at least your own mailbox has the filter/Primary rule in place
- [ ] Ramp: first full-list send only after Phase 1–2 sends land with no complaints
