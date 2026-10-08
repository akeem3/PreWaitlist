# Founder Marketing Links — Dub + UTM Playbook

**Story:** [20.4](../stories/story-20.4-founder-marketing-links-dub-utm.md) · **Epic:** 20 — Feedback, Onboarding & Growth Tooling
**Audience:** founder (solo marketer) · **Status:** active

Internal reference — distinct tracked links per social channel so each signup can be traced back to the channel that drove it. Not product UI copy.

---

## 1. UTM Convention (AC1)

Every marketing link you post anywhere gets three UTM parameters. Fixed vocabularies — never invent new values mid-campaign.

### Parameters

| Param          | Meaning                       | Rule                                                           |
| -------------- | ----------------------------- | -------------------------------------------------------------- |
| `utm_source`   | Which platform sent the click | Closed list (below), lowercase                                 |
| `utm_medium`   | Channel type                  | Closed list: `social` \| `launch` \| `email`                   |
| `utm_campaign` | Campaign name                 | `{initiative}-{year}`, lowercase, hyphens (e.g. `launch-2026`) |

`utm_term` and `utm_content` exist in the capture code but are optional — leave them off unless you're A/B-ing two links in the same channel. They ride the cookie only; only `source`/`medium`/`campaign` (plus `ref`) are persisted to `founder_profiles`.

### `utm_source` closed list

| Channel                  | `utm_source` value |
| ------------------------ | ------------------ |
| X / Twitter              | `twitter`          |
| LinkedIn                 | `linkedin`         |
| Reddit                   | `reddit`           |
| Product Hunt             | `ph`               |
| Indie Hackers            | `indiehackers`     |
| Newsletter / email blast | `newsletter`       |
| Founder's personal site  | `site`             |

- **Lowercase always** — `Twitter` ≠ `twitter` splits the data (UTM values are case-sensitive).
- **Hyphens, never spaces** — spaces URL-encode to `%20` and look broken.
- **No abbreviations unless in the list** — `fb`, `x`, `tw` are not approved spellings; use the table.
- **No PII or secrets** in any parameter.

### `utm_medium` rules

| Value    | Use for                                              |
| -------- | ---------------------------------------------------- |
| `social` | Ongoing social posts (Twitter, LinkedIn, Reddit, IH) |
| `launch` | Product Hunt launch day, launch-week pushes          |
| `email`  | Newsletters, email blasts                            |

### Worked examples

Landing URL is always the apex: `https://www.prewaitlist.com/`

```text
# Twitter/X post
https://www.prewaitlist.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch-2026

# LinkedIn post
https://www.prewaitlist.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch-2026

# Reddit post (r/SaaS, r/indiehackers, …)
https://www.prewaitlist.com/?utm_source=reddit&utm_medium=social&utm_campaign=launch-2026

# Product Hunt launch
https://www.prewaitlist.com/?utm_source=ph&utm_medium=launch&utm_campaign=launch-2026

# Newsletter
https://www.prewaitlist.com/?utm_source=newsletter&utm_medium=email&utm_campaign=launch-2026
```

**Keep campaigns stable** for their whole life — don't rename `launch-2026` → `launch-2026-v2` halfway through; that splits the report.

### What is NOT a channel UTM

| Param   | System                                                                                                   | Do not reuse for channel attribution        |
| ------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `?ref=` | **Subscriber referral code** — when a subscriber shares their personal link and someone joins after them | Different system, do not confuse            |
| `?src=` | Powered-by footer attribution (`src=powered-by`)                                                         | Product attribution, not marketing channels |

`utm_*` = "which channel brought this founder here." `ref` = "which subscriber deserves credit." Keep them separate.

---

## 2. Dub Setup (AC2)

**Free tier (verified 2026-10-04):** 25 new links/month · 1,000 tracked clicks/month · 30-day analytics retention · 3 custom domains.

### Account creation (founder step, one time)

1. Go to `app.dub.co` → sign up (Google or email).
2. Create a workspace (e.g. `prewaitlist`).
3. Stay on the free plan — limits above are sufficient for launch.

### Create one link per channel

1. Open the Dub dashboard → **Create link** (button, keyboard shortcut `c`, or just paste a URL — the link builder opens prefilled). Source: `dub.co/help/article/how-to-create-link`.
2. **Destination URL** — paste the full worked-example URL from §1 for that channel (with the `utm_*` params already on it).
3. **Short link** — pick the domain (`dub.sh` default, or one of the 3 custom domains) and a readable slug:
   - `dub.sh/x`, `dub.sh/li`, `dub.sh/rd`, `dub.sh/ph`, `dub.sh/nl` (or any short slugs you prefer — one per channel).
4. Optional but recommended: use the built-in **UTM Builder** (shortcut `U` inside the builder) to fill `utm_source`/`utm_medium`/`utm_campaign` instead of hand-typing — it appends them to the destination. Save the values as a **UTM template** so every new link reuses the exact convention (`dub.co/help/article/how-to-create-utm-templates`).
5. **Tags** — tag each link with its channel (e.g. `twitter`, `linkedin`, `reddit`, `ph`, `email`) for grouped filtering later.
6. Save. Repeat for each channel — **one link per channel per campaign**; never reuse a link across channels (that destroys source attribution).

Each link consumes 1 of the 25 monthly link creations; clicks count against the 1K/month cap.

### Where to read per-link results

- **Links dashboard** — each row shows its live click counter at a glance.
- **Per-link analytics** — click a link's performance counter → full analytics page (timeseries chart, referrer breakdown, top locations/devices, real-time events stream). Source: `dub.co/help/article/dub-analytics`.
- **Shareable dashboard** — per link, hover the performance counter → **Share dashboard** for a public read-only analytics URL (`dub.co/help/article/share-analytics`).
- Free tier keeps 30 days of analytics — export or screenshot anything you want to keep past that.

Dub measures **clicks**. Signup conversion is measured in PostHog (§3) — Dub and PostHog answer different questions.

---

## 3. Attribution Verification — End-to-End (AC3)

Prove once that a channel link survives the full journey: **Dub click → landing → signup → PostHog event**.

### How the data flows (built into the product)

1. Visitor opens your Dub link → lands on `https://www.prewaitlist.com/?utm_source=…&utm_medium=…&utm_campaign=…`.
2. **`src/proxy.ts` → `captureAcquisition()`** (Story 3.0) reads the UTMs on the root path `/` and writes the `mw_acquisition` cookie (30-day, shared across all subdomains). ⚠️ Capture only fires on `/` — always land UTM links on the homepage, not a subpage.
3. Visitor signs up → **`src/app/auth/callback/route.ts`** reads the cookie and persists `utm_source`, `utm_medium`, `utm_campaign` (+ `ref_param`) to `founder_profiles` with `acquisition_captured_at`, creating the profile row on first signup if it doesn't exist yet.
4. **PostHog (20.1)** independently auto-captures the UTM params present on the landing `$pageview` — as event properties and as person properties.

### Verification steps

1. Take the Twitter worked example (§1) → shorten it in Dub → copy the Dub short link.
2. Open it in a **fresh private/incognito window** → confirm you land on the homepage and the address bar shows the `utm_*` params.
3. Sign up with **email + password** — the `account_created` event only fires on the email path (Google/OAuth signups skip it) — and **stay in that same window for the entire journey**: the acquisition cookie (30 days) and PostHog's first-touch record are browser-scoped, so opening the verification link in a different browser (or your normal window while testing from a private one) loses both. Practical route: open your webmail inside that same private window, or copy the verification link and paste it into that window's address bar.
4. **Check PostHog** (Activity → the person, or an insight filtered on your event):
   - The landing **`$pageview` event properties** contain `utm_source = twitter`, `utm_medium = social`, `utm_campaign = launch-2026`.
   - **`account_created` and `onboarding_started` both show `utm_source = twitter`** as event properties — in the standard journey both fire in the same session as the landing page, so the session campaign params merge into them (AC3).
   - On the person profile, first-touch **`$initial_utm_source` = `twitter`** is present.
5. **Check the second record (DB):** in Supabase, `founder_profiles.utm_source` for the new account = `twitter` (and `utm_medium`/`utm_campaign` match), `acquisition_captured_at` is set.
6. Repeat once with one other channel (e.g. the LinkedIn link) — values must differ per link.
7. Cross-check counts: Dub clicks (per link) vs PostHog `$pageview` with that `utm_source` — they won't match exactly (bots, bounces, ad blockers) but the channel ranking should agree.

### Reading the results in PostHog — two gotchas

- **First-touch vs latest-touch:** `$initial_utm_source` (first-touch) is backfilled on `identify()` — it survives anonymous → identified and is the reliable person-level record. Latest-touch `utm_source` person properties are **not** backfilled: they only appear on events captured after the person profile exists. So a visitor who lands from a campaign anonymously and identifies later will show the campaign on their landing `$pageview` and in `$initial_utm_*`, but not necessarily as a latest-touch person prop. **Filter on the event properties of `$pageview`, or on `$initial_utm_source` — not on latest-touch `utm_source`.** Source: `posthog.com/docs/data/utm-segmentation`.
- **Where `account_created` / `onboarding_started` fire — and whether they carry UTMs:** neither fires on the UTM-tagged URL itself — `account_created` fires on the **`/signup` page at form submit** (email path only; OAuth skips it) and `onboarding_started` on **`/onboarding/1`**. In the standard journey both happen in the same browser session as the landing page, so PostHog's session campaign params are merged into them and they **do show `utm_source` as event properties** (this is what AC3 checks). If you resumed signup in a new tab or a later visit (new PostHog session), the plain `utm_*` props can be missing on those events — that is a session boundary, not a lost campaign: fall back to `$initial_utm_source` on the person or the landing `$pageview`'s event properties.

### Success criteria

| Check                                          | Tool     | Expected                                                              |
| ---------------------------------------------- | -------- | --------------------------------------------------------------------- |
| Click registered                               | Dub      | +1 on the channel's link                                              |
| Landing `$pageview` has matching `utm_*`       | PostHog  | event properties match                                                |
| `$initial_utm_source` set on person            | PostHog  | matches the channel                                                   |
| `account_created` / `onboarding_started` fires | PostHog  | both fire **with `utm_source` matching** (fallback: `$initial_utm_*`) |
| `founder_profiles.utm_source/medium/campaign`  | Supabase | matches, `acquisition_captured_at` set                                |

If Dub counts the click but PostHog shows no UTMs → the link's destination is missing the `utm_*` params (re-check §1). If PostHog sees UTMs but `founder_profiles` is empty → the visitor signed up >30 days after landing (cookie expiry, same browser — PostHog's 365-day first-touch still records it) or completed signup in a different browser (both records lost there); treat PostHog as the system of record for channel reporting.

---

## 4. Scope Notes

- **Product code:** UTM capture (`proxy.ts`) and PostHog auto-capture were verified working during the 20.4 bug hunt, but the 20.4 audit found one UTM-pass bug: a fresh signup has no `founder_profiles` row yet, so the callback's write silently no-opped and the cookie was discarded — **fixed** (create-if-missing upsert in `auth/callback`, AC4's sanctioned fix task). This story is otherwise setup + documentation.
- **Out of scope:** shortening links inside the product, subscriber-facing share links (`ShareButtons`/`ReferralLink` — that's the `?ref=` system), GA/other analytics install.
- Dub account creation is a founder step (approved).
