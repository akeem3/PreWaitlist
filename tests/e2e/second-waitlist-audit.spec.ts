import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Story 19.6 — Second-Waitlist Flow Audit (AC1-AC4).
 *
 * Evidence run, not a regression suite: exercises the multi-waitlist flow
 * end-to-end against the QA account and records observed behavior verbatim
 * (upgrades gates, modals, archive/gone, cross-list isolation) into
 * docs/qa/second-waitlist-audit/findings.json + docs/qa/screenshots/19.6-*.
 *
 * Tier choreography: normalize free → record free-gate evidence → flip pro →
 * create/verify list B → flip back to free in finally (re-runs start free).
 */

const SHOTS_DIR = path.join(process.cwd(), "docs", "qa", "screenshots");
const REPORT_DIR = path.join(
  process.cwd(),
  "docs",
  "qa",
  "second-waitlist-audit"
);
const CRED_PATH = path.join(
  process.cwd(),
  "tests",
  "e2e",
  ".auth",
  "qa-credentials.json"
);
const ONBOARDING_KEY = "prewaitlist_onboarding";
const WIZARD_SLUGS = ["qa2", "qa2b", "qa2c", "qa2d"];
const SECOND_NAME = "QA Second";
const SECOND_HEADLINE = "QA Second waitlist";
const UPDATED_HEADLINE = "QA Second B updated";
const ISOLATION_UPDATE = "QA isolation update for A";
const B_EMAIL_DOMAIN = "qa2isolation.test";

interface WaitlistRow {
  waitlistId: string;
  slug: string;
  productName?: string;
  headline?: string;
  subscriberCount?: number;
  isArchived?: boolean;
}

interface Step {
  name: string;
  ok: boolean;
  detail: string;
  screenshot?: string | null;
}

interface Finding {
  id: string;
  ac: "AC1" | "AC2" | "AC3" | "AC4";
  severity: "P0" | "P1" | "P2" | "observation";
  detail: string;
  verbatim?: string;
  screenshot?: string | null;
  disposition?: "fixed" | "deferred" | "as-designed";
}

function readCredentials(): { email: string; password: string; id?: string } {
  if (fs.existsSync(CRED_PATH)) {
    const raw = fs.readFileSync(CRED_PATH, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  }
  if (process.env.QA_EMAIL && process.env.QA_PASSWORD) {
    return { email: process.env.QA_EMAIL, password: process.env.QA_PASSWORD };
  }
  throw new Error(
    `QA credentials missing — expected ${CRED_PATH} or QA_EMAIL/QA_PASSWORD env.`
  );
}

function loadEnvLocal(): Record<string, string> {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function serviceEnv(): { base: string; key: string } {
  const envLocal = loadEnvLocal();
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL || envLocal.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || envLocal.SUPABASE_SECRET_KEY;
  if (!base || !key) {
    throw new Error(
      "audit needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local"
    );
  }
  return { base, key };
}

async function setTier(tier: "free" | "pro", userId: string): Promise<string> {
  const { base, key } = serviceEnv();
  const res = await fetch(`${base}/rest/v1/founder_profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ tier }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`tier flip → ${tier} failed: ${res.status()} ${body}`);
  }
  const rows = JSON.parse(body || "[]");
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      `tier flip → ${tier}: no founder_profiles row for ${userId}`
    );
  }
  return `tier → ${tier} (${res.status})`;
}

async function restCall(
  method: string,
  tableQuery: string,
  body?: unknown
): Promise<{ status: number; text: string }> {
  const { base, key } = serviceEnv();
  const res = await fetch(`${base}/rest/v1/${tableQuery}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

async function restSelect<T = Record<string, unknown>>(
  query: string
): Promise<T[]> {
  const { status, text } = await restCall("GET", query);
  if (status >= 400) {
    throw new Error(`REST select ${query} → ${status}: ${text.slice(0, 200)}`);
  }
  const rows = JSON.parse(text || "[]");
  return Array.isArray(rows) ? (rows as T[]) : [];
}

test.describe("19.6 second waitlist flow audit", () => {
  test.setTimeout(300_000);

  test("create → switch → isolate → persist → archive", async ({ page }) => {
    // A dead selector should fail its step in 15s, not eat the whole test budget.
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(30_000);
    const steps: Step[] = [];
    const findings: Finding[] = [];
    const verbatim: Record<string, unknown> = {};
    const tierFlips: string[] = [];
    let fatal: string | null = null;

    const shot = async (name: string): Promise<string> => {
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      const p = path.join(SHOTS_DIR, `${name}.png`);
      await page.screenshot({ path: p });
      return path.relative(process.cwd(), p);
    };
    const step = (
      name: string,
      ok: boolean,
      detail: string,
      screenshot?: string
    ): void => {
      steps.push({ name, ok, detail, screenshot: screenshot ?? null });
    };

    page.on("dialog", (d) => {
      void d.accept();
    });

    const creds = readCredentials();
    const userId = creds.id;
    if (!userId) throw new Error("QA credentials file has no id");

    try {
      // ---- Phase 0: login + normalize baseline tier = free ----
      await page.setViewportSize({ width: 1280, height: 800 });
      // Sign-in is intermittently slow against Supabase (observed "Signing in..."
      // hangs >30s on 2 of 5 runs) — retry with a fresh page load each attempt.
      let loginAttempts = 0;
      let loginErr: unknown = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        loginAttempts = attempt;
        await page.goto("/signin", { waitUntil: "load" });
        await page.fill('input[name="email"]', creds.email);
        await page.fill('input[name="password"]', creds.password);
        try {
          await Promise.all([
            page.waitForURL(/\/(dashboard|onboarding)/, {
              timeout: attempt === 1 ? 30_000 : 45_000,
            }),
            page.click('button[type="submit"]'),
          ]);
          loginErr = null;
          break;
        } catch (err) {
          loginErr = err;
          // Slow sign-in may land after the timeout — accept it if we're there.
          if (/\/(dashboard|onboarding)/.test(page.url())) {
            loginErr = null;
            break;
          }
        }
      }
      if (loginErr) throw loginErr;
      step(
        "login",
        true,
        `signed in as ${creds.email}` +
          (loginAttempts > 1 ? ` (attempt ${loginAttempts})` : "")
      );

      const api = page.context().request;
      const profile = await restSelect<{ tier: string }>(
        `founder_profiles?id=eq.${userId}&select=tier`
      );
      const baselineTier = profile[0]?.tier ?? "free";
      if (baselineTier !== "free") {
        tierFlips.push(await setTier("free", userId));
        step(
          "baseline tier",
          true,
          `normalized ${baselineTier} → free (re-runs start free)`
        );
      } else {
        step("baseline tier", true, "already free");
      }

      const listRes = await api.get("/api/waitlist");
      const lists = listRes.ok()
        ? ((await listRes.json()) as WaitlistRow[])
        : [];
      const a = lists[0];
      if (!a) throw new Error("QA account has no waitlist — expected list A");
      step(
        "list A present",
        true,
        `slug=${a.slug} subscriberCount=${a.subscriberCount ?? "?"} headline="${a.headline ?? ""}"`
      );

      // ---- Phase 1: FREE attempt at a second list (AC2) ----
      await page.goto("/dashboard", { waitUntil: "load" });
      await page.evaluate(() => {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith("upgrade-dismissed-")) localStorage.removeItem(k);
        }
      });

      // 1a. header add button → upgrade modal?
      try {
        const addBtn = page.getByRole("button", {
          name: "Add new waitlist",
          exact: true,
        });
        await expect(addBtn).toBeVisible({ timeout: 10_000 });
        await addBtn.click();
        const closeBtn = page.getByRole("button", { name: "Close" });
        await expect(closeBtn).toBeVisible({ timeout: 6_000 });
        const modal = closeBtn.locator(
          "xpath=ancestor::*[contains(@class,'fixed')][1]"
        );
        let heading = (
          (await modal.locator("h2, h3").first().textContent()) ?? ""
        ).trim();
        if (!heading) {
          heading = ((await modal.innerText()) ?? "").split("\n")[0].trim();
        }
        verbatim.freeHeaderModalHeading = heading;
        const s = await shot("19.6-free-attempt-header-modal");
        step(
          "AC2 — free: header add button",
          true,
          `upgrade modal opened, heading: "${heading}"`,
          s
        );
        await closeBtn.click();
        await expect(closeBtn).toBeHidden({ timeout: 5_000 });
      } catch (err) {
        const s = await shot("19.6-free-attempt-header-modal-failed");
        step(
          "AC2 — free: header add button",
          false,
          `no modal opened: ${(err as Error).message.split("\n")[0]}`,
          s
        );
        findings.push({
          id: "F1",
          ac: "AC2",
          severity: "P1",
          detail:
            "Free 'Add new waitlist' (header) did not open an upgrade/limit modal",
        });
      }

      // 1b. switcher add button → upgrade modal?
      try {
        // Force active = A first — a prior run can leave an archived B as the
        // stored active list, which would change the trigger's label.
        await page.goto(`/dashboard?wid=${a.waitlistId}`, {
          waitUntil: "load",
        });
        await page.evaluate(() => {
          for (const k of Object.keys(localStorage)) {
            if (k.startsWith("upgrade-dismissed-")) localStorage.removeItem(k);
          }
        });
        const swTrigger = page.getByRole("button", {
          name: a.productName || "PreWaitlist",
          exact: true,
        });
        await swTrigger.click();
        // Scope to the switcher container — the header has an identically
        // labelled "Add new waitlist" button (strict-mode collision otherwise).
        const swContainer = swTrigger.locator("xpath=..");
        const swAdd = swContainer.getByRole("button", {
          name: "Add new waitlist",
          exact: true,
        });
        await expect(swAdd).toBeVisible({ timeout: 5_000 });
        await swAdd.click();
        const closeBtn = page.getByRole("button", { name: "Close" });
        await expect(closeBtn).toBeVisible({ timeout: 6_000 });
        const modal = closeBtn.locator(
          "xpath=ancestor::*[contains(@class,'fixed')][1]"
        );
        let heading = (
          (await modal.locator("h2, h3").first().textContent()) ?? ""
        ).trim();
        if (!heading) {
          heading = ((await modal.innerText()) ?? "").split("\n")[0].trim();
        }
        verbatim.freeSwitcherModalHeading = heading;
        const s = await shot("19.6-free-attempt-switcher-modal");
        step(
          "AC2 — free: switcher add button",
          true,
          `upgrade modal opened, heading: "${heading}"`,
          s
        );
        await closeBtn.click();
      } catch (err) {
        step(
          "AC2 — free: switcher add button",
          false,
          `no modal: ${(err as Error).message.split("\n")[0]}`
        );
      }

      // 1c. API attempt → expect the 402 gate verbatim
      const freePost = await api.post("/api/waitlist", {
        data: {
          subdomain: WIZARD_SLUGS[0],
          product_name: SECOND_NAME,
          headline: SECOND_HEADLINE,
        },
      });
      const freeBody = await freePost.text();
      verbatim.freeApiStatus = freePost.status();
      verbatim.freeApiBody = freeBody;
      const freeGateOk =
        freePost.status() === 402 &&
        freeBody.includes("Upgrade to Pro to create more waitlists");
      step(
        "AC2 — free: API POST second list",
        freeGateOk,
        `status ${freePost.status()}: ${freeBody.slice(0, 200)}`
      );
      if (!freeGateOk) {
        findings.push({
          id: "F2",
          ac: "AC2",
          severity: "P1",
          detail: `POST /api/waitlist while free with ≥1 list: expected 402 gate, got ${freePost.status()}`,
          verbatim: freeBody.slice(0, 300),
        });
      }

      // ---- Phase 2: flip pro (founder-approved test gate) ----
      tierFlips.push(await setTier("pro", userId));
      step("AC2 — tier flip", true, "founder_profiles.tier = pro");

      // ---- Phase 3: create list B via wizard (reuse when it exists) ----
      let listsNow = (await (
        await api.get("/api/waitlist")
      ).json()) as WaitlistRow[];
      let b = listsNow.find((w) => WIZARD_SLUGS.includes(w.slug));
      if (b && b.isArchived) {
        const un = await restCall("PATCH", `waitlists?id=eq.${b.waitlistId}`, {
          is_archived: false,
          archived_at: null,
        });
        if (un.status >= 400) {
          throw new Error(`unarchive stale B failed: ${un.status} ${un.text}`);
        }
        step("setup", true, `unarchived ${b.slug} left over from a prior run`);
      }
      if (!b) {
        let slug = "";
        for (const cand of WIZARD_SLUGS) {
          const r = await api.get(
            `/api/waitlist/check-slug?slug=${encodeURIComponent(cand)}`
          );
          const j: { available?: boolean } = r.ok()
            ? await r.json()
            : { available: false };
          if (j.available) {
            slug = cand;
            break;
          }
        }
        if (!slug) throw new Error("no candidate slug available");

        // Fresh Phase-A draft so smart-resume can't skip Step 1
        await page.goto("/onboarding/1", { waitUntil: "load" });
        await page.evaluate((k) => localStorage.removeItem(k), ONBOARDING_KEY);
        await page.reload({ waitUntil: "load" });
        await expect(page.locator("#slug")).toBeVisible({ timeout: 15_000 });

        await page.fill("#productName", SECOND_NAME);
        await page.fill("#headline", SECOND_HEADLINE);
        await page.fill("#slug", slug);
        const submit1 = page.locator('button[type="submit"]').last();
        await expect(submit1).toBeEnabled({ timeout: 15_000 });
        await submit1.click();
        await page.waitForURL("**/onboarding/2", { timeout: 20_000 });

        await page
          .getByRole("button", { name: /Minimal/ })
          .first()
          .click();
        await page.locator('button[type="submit"]').last().click();
        await page.waitForURL("**/onboarding/3", { timeout: 20_000 });

        // Step 3 Next → flushToAPI POST → FlushGate → /onboarding/4
        await page.locator('button[type="submit"]').last().click();
        await page.waitForURL("**/onboarding/4", { timeout: 45_000 });
        await expect(
          page.getByRole("heading", {
            name: "Want to add qualification questions?",
          })
        ).toBeVisible({ timeout: 20_000 });
        const s = await shot("19.6-wizard-created-step4");
        step(
          "AC1 — wizard creates list B",
          true,
          `slug=${slug}: Step 1→4 completed, FlushGate picked up the new list`,
          s
        );

        await page.goto("/dashboard", { waitUntil: "load" });
        listsNow = (await (
          await api.get("/api/waitlist")
        ).json()) as WaitlistRow[];
        b = listsNow.find((w) => w.slug === slug);
        if (!b) {
          throw new Error(
            "list B missing after wizard — POST /api/waitlist did not persist"
          );
        }
      } else {
        step(
          "AC1 — wizard creates list B",
          true,
          `reused existing B from a prior run (slug=${b.slug})`
        );
      }

      // settings hub shows both lists (AC1: "appears in waitlist list")
      await page.goto("/dashboard/settings/waitlists", { waitUntil: "load" });
      await expect(page.getByText(`${b.slug}.prewaitlist.com`)).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(`${a.slug}.prewaitlist.com`)).toBeVisible({
        timeout: 10_000,
      });
      const sHub = await shot("19.6-settings-hub-two-lists");
      step(
        "AC1 — B appears in settings hub",
        true,
        `${b.slug} listed alongside ${a.slug}`,
        sHub
      );
      // Observation: AC1 says "create second waitlist from settings hub", but the
      // hub has no add button once ≥1 list exists — creation happens via the
      // header/switcher buttons (both → /onboarding/1).
      findings.push({
        id: "F3",
        ac: "AC1",
        severity: "observation",
        detail:
          "Settings hub (/dashboard/settings/waitlists) has no 'create/add' button when ≥1 list exists; second-list creation entry points are the header + switcher buttons. List DOES appear in the hub after creation.",
        disposition: "as-designed",
      });

      // ---- Phase 4: seed B (2 subscribers) + update on A for isolation ----
      type SubRow = { id: string; email: string };
      const bRows = await restSelect<SubRow>(
        `subscribers?waitlist_id=eq.${b.waitlistId}&select=id,email`
      );
      const want = [
        { email: `qa2-sub-1@${B_EMAIL_DOMAIN}`, code: "c0de0001", pos: 1 },
        { email: `qa2-sub-2@${B_EMAIL_DOMAIN}`, code: "c0de0002", pos: 2 },
      ];
      const missing = want.filter(
        (w) => !bRows.some((r) => r.email === w.email)
      );
      if (missing.length > 0) {
        const ins = await restCall(
          "POST",
          "subscribers",
          missing.map((m) => ({
            waitlist_id: b.waitlistId,
            email: m.email,
            referral_code: m.code,
            position: m.pos,
          }))
        );
        if (ins.status >= 400) {
          throw new Error(`seed subscribers failed: ${ins.status} ${ins.text}`);
        }
      }
      const bCount = (
        await restSelect<SubRow>(
          `subscribers?waitlist_id=eq.${b.waitlistId}&select=id,email`
        )
      ).length;
      await restCall("PATCH", `waitlists?id=eq.${b.waitlistId}`, {
        subscriber_count: bCount,
      });
      const aUpdates = await restSelect(
        `founder_updates?waitlist_id=eq.${a.waitlistId}&select=id`
      );
      if (aUpdates.length === 0) {
        const ins = await restCall("POST", "founder_updates", [
          { waitlist_id: a.waitlistId, body: ISOLATION_UPDATE },
        ]);
        if (ins.status >= 400) {
          throw new Error(`A update insert failed: ${ins.status} ${ins.text}`);
        }
      }
      step(
        "setup — isolation fixtures",
        true,
        `B subscribers=${bCount}; A update present=${aUpdates.length > 0 || true}`
      );

      // ---- Phase 5: switch via ?wid + switcher (AC1) ----
      await page.goto(`/dashboard?wid=${b.waitlistId}`, { waitUntil: "load" });
      await expect(
        page.getByRole("button", { name: SECOND_NAME, exact: true })
      ).toBeVisible({ timeout: 15_000 });
      step(
        "AC1 — ?wid switches active list",
        true,
        `dashboard?wid=${b.waitlistId} renders switcher labelled "${SECOND_NAME}"`
      );

      await page.goto(`/dashboard?wid=${a.waitlistId}`, { waitUntil: "load" });
      await page
        .getByRole("button", {
          name: a.productName || "PreWaitlist",
          exact: true,
        })
        .click();
      const sSwitcher = await shot("19.6-switcher-two-lists");
      await page
        .getByRole("button", { name: SECOND_NAME, exact: true })
        .click();
      await page.waitForURL(new RegExp(`wid=${b.waitlistId}`), {
        timeout: 10_000,
      });
      await expect(
        page.getByRole("button", { name: SECOND_NAME, exact: true })
      ).toBeVisible({ timeout: 10_000 });
      step(
        "AC1 — switcher switches active list",
        true,
        `A → B via dropdown; URL keeps wid=${b.waitlistId}`,
        sSwitcher
      );

      // ---- Phase 6: cross-list isolation (AC3) ----
      const readStat = async (label: string): Promise<string> => {
        const card = page
          .getByText(label, { exact: true })
          .first()
          .locator("xpath=..");
        const value = card.locator("div").first();
        await expect(value).toHaveText(/\d/, { timeout: 15_000 });
        return (await value.innerText()).trim();
      };

      await page.goto(`/dashboard?wid=${b.waitlistId}`, { waitUntil: "load" });
      const bStats = await readStat("Total signups");
      await page.goto(`/dashboard?wid=${a.waitlistId}`, { waitUntil: "load" });
      const aStats = await readStat("Total signups");
      const aCount = String(a.subscriberCount ?? "");
      const statsOk = bStats === String(bCount) && aStats === aCount;
      step(
        "AC3 — stat cards isolate per list",
        statsOk,
        `Total signups: B=${bStats} (expect ${bCount}), A=${aStats} (expect ${aCount})`
      );
      if (!statsOk) {
        findings.push({
          id: "F4",
          ac: "AC3",
          severity: "P1",
          detail: `stat card mismatch/leak: B UI=${bStats} expect ${bCount}; A UI=${aStats} expect ${aCount}`,
        });
      }

      // leaderboard rows disjoint
      await page.goto(`/${a.slug}/leaderboard`, { waitUntil: "load" });
      const aLeader = await page.locator("body").innerText();
      const sLeadA = await shot("19.6-leaderboard-A");
      await page.goto(`/${b.slug}/leaderboard`, { waitUntil: "load" });
      const bLeader = await page.locator("body").innerText();
      const sLeadB = await shot("19.6-leaderboard-B");
      // Leaderboard anonymizes to "q•••1" with NO domain, so the reliable
      // isolation signal is the pagination footer: "Showing 1–N of N".
      const aFooter = `of ${aCount}`;
      const bFooter = `of ${String(bCount)}`;
      const leadOk =
        bLeader.includes(`Showing 1–${bCount} of ${bCount}`) &&
        aLeader.includes(`Showing 1–${aCount} of ${aCount}`) &&
        (aCount === String(bCount) ||
          (!bLeader.includes(aFooter) && !aLeader.includes(bFooter)));
      step(
        "AC3 — leaderboard rows disjoint",
        leadOk,
        `B footer has "${bFooter}"=${bLeader.includes(bFooter)}, A footer has "${aFooter}"=${aLeader.includes(aFooter)}; anonymized names carry no domain (assertion uses pagination totals)`,
        `${sLeadA} | ${sLeadB}`
      );
      if (!leadOk) {
        findings.push({
          id: "F5",
          ac: "AC3",
          severity: "P1",
          detail: "leaderboard shows cross-list subscribers",
          screenshot: `${sLeadA} | ${sLeadB}`,
        });
      }

      // updates feed isolated
      await page.goto(`/dashboard/updates?wid=${a.waitlistId}`, {
        waitUntil: "load",
      });
      const aUpdText = await page.locator("body").innerText();
      await page.goto(`/dashboard/updates?wid=${b.waitlistId}`, {
        waitUntil: "load",
      });
      const bUpdText = await page.locator("body").innerText();
      const updOk =
        aUpdText.includes(ISOLATION_UPDATE) &&
        !bUpdText.includes(ISOLATION_UPDATE);
      step(
        "AC3 — updates feed isolated",
        updOk,
        `A shows update=${aUpdText.includes(ISOLATION_UPDATE)}, B shows update=${bUpdText.includes(ISOLATION_UPDATE)}`
      );
      if (!updOk) {
        findings.push({
          id: "F6",
          ac: "AC3",
          severity: "P1",
          detail:
            "founder update leaked across waitlists (or A update missing)",
        });
      }

      // warmth isolated (pro-gated page — we are pro here)
      await page.goto(`/dashboard/warmth?wid=${b.waitlistId}`, {
        waitUntil: "load",
      });
      await expect(
        page.getByText(`${bCount} subscribers`, { exact: true })
      ).toBeVisible({ timeout: 15_000 });
      const sWarmB = await shot("19.6-warmth-B");
      await page.goto(`/dashboard/warmth?wid=${a.waitlistId}`, {
        waitUntil: "load",
      });
      await expect(
        page.getByText(`${aCount} subscribers`, { exact: true })
      ).toBeVisible({ timeout: 15_000 });
      step(
        "AC3 — warmth totals isolated",
        true,
        `B warmth total=${bCount}, A warmth total=${aCount}`,
        sWarmB
      );

      // broadcast page renders per list without cross-content
      await page.goto(`/dashboard/broadcast?wid=${b.waitlistId}`, {
        waitUntil: "load",
      });
      const bBroadcast = await page.locator("body").innerText();
      const sBc = await shot("19.6-broadcast-B");
      await page.goto(`/dashboard/broadcast?wid=${a.waitlistId}`, {
        waitUntil: "load",
      });
      const aBroadcast = await page.locator("body").innerText();
      const bcOk =
        bBroadcast.length > 0 &&
        aBroadcast.length > 0 &&
        !bBroadcast.includes(ISOLATION_UPDATE);
      step(
        "AC3 — broadcast page per list",
        bcOk,
        `B chars=${bBroadcast.length}, A chars=${aBroadcast.length}; no A-update content on B broadcast page`,
        sBc
      );
      if (!bcOk) {
        findings.push({
          id: "F7",
          ac: "AC3",
          severity: "P1",
          detail: "broadcast page missing or showing cross-list content",
        });
      }

      // ---- Phase 7: per-waitlist settings edit persists (AC1) ----
      await page.goto(`/dashboard/${b.waitlistId}/settings`, {
        waitUntil: "load",
      });
      const headInput = page.getByLabel("Headline", { exact: true });
      await expect(headInput).toBeVisible({ timeout: 15_000 });
      await headInput.fill(UPDATED_HEADLINE);
      await headInput.blur();
      await expect(page.getByText("Saved", { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await page.reload({ waitUntil: "load" });
      await expect(page.getByLabel("Headline", { exact: true })).toHaveValue(
        UPDATED_HEADLINE,
        { timeout: 15_000 }
      );
      const sPersist = await shot("19.6-settings-persist-after-reload");
      const listsAfter = (await (
        await api.get("/api/waitlist")
      ).json()) as WaitlistRow[];
      const aAfter = listsAfter.find((w) => w.waitlistId === a.waitlistId);
      const bAfter = listsAfter.find((w) => w.waitlistId === b.waitlistId);
      const persistOk =
        bAfter?.headline === UPDATED_HEADLINE &&
        aAfter?.headline === a.headline;
      step(
        "AC1 — settings edit persists per list",
        persistOk,
        `B headline="${bAfter?.headline ?? ""}" after reload; A headline unchanged=${aAfter?.headline === a.headline}`,
        sPersist
      );
      if (!persistOk) {
        findings.push({
          id: "F8",
          ac: "AC1",
          severity: "P1",
          detail: `settings persistence failed: B="${bAfter?.headline}" A "${aAfter?.headline}" vs original "${a.headline}"`,
        });
      }

      // ---- Phase 8: archive → gone → unarchive (AC1) ----
      await page.goto("/dashboard/settings/waitlists", { waitUntil: "load" });
      const row = page
        .locator("div.group", { hasText: `${b.slug}.prewaitlist.com` })
        .first();
      await expect(row).toBeVisible({ timeout: 10_000 });
      await row.getByRole("button").first().click();
      await page.getByRole("button", { name: "Archive", exact: true }).click();
      await expect(
        page.getByRole("button", { name: /Archived \(1\)/ })
      ).toBeVisible({ timeout: 10_000 });
      const sArch = await shot("19.6-archived-section");
      step(
        "AC1 — archive hides B",
        true,
        "Archived (1) section shows the archived list",
        sArch
      );

      // Archived list stays the ACTIVE list, with an explanatory banner
      // (as-is UX evidence: no auto-redirect away from an archived list).
      await page.goto("/dashboard", { waitUntil: "load" });
      await expect(page.getByText("This waitlist is archived.")).toBeVisible({
        timeout: 10_000,
      });
      const sBanner = await shot("19.6-archived-active-banner");
      step(
        "AC1 — active list archived → banner",
        true,
        'active stays on archived B with banner "This waitlist is archived." + Unarchive link',
        sBanner
      );

      // switcher marks the archived list (with A active so the trigger is A)
      await page.goto(`/dashboard?wid=${a.waitlistId}`, { waitUntil: "load" });
      const swTrigger2 = page.getByRole("button", {
        name: a.productName || "PreWaitlist",
        exact: true,
      });
      await swTrigger2.click();
      await expect(
        swTrigger2.locator("xpath=..").getByText("Archived", { exact: true })
      ).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press("Escape");
      step(
        "AC1 — switcher marks archived list",
        true,
        "Archived badge visible in dropdown"
      );

      // public leaderboard redirects to /gone
      let goneOk = false;
      let goneDetail = "";
      try {
        await page.goto(`http://localhost:3000/${b.slug}/leaderboard`, {
          waitUntil: "load",
        });
        await page.waitForURL(/\/gone/, { timeout: 10_000 });
        goneOk = true;
        goneDetail = `leaderboard → ${new URL(page.url()).pathname}`;
      } catch {
        goneDetail = `leaderboard NOT redirected — landed on ${new URL(page.url()).pathname}`;
      }

      // archived main page must not accept signups
      await page.goto(`http://localhost:3000/${b.slug}`, {
        waitUntil: "load",
      });
      const signupInputs = await page
        .locator('form input[type="email"]')
        .count();
      const sGone = await shot("19.6-archived-main-page");
      const goneCheckOk = goneOk && signupInputs === 0;
      step(
        "AC1 — archived list is gone / not accepting signups",
        goneCheckOk,
        `${goneDetail}; signup email inputs on main page=${signupInputs}`,
        sGone
      );
      if (!goneOk) {
        findings.push({
          id: "F9",
          ac: "AC1",
          severity: "P1",
          detail: `archived ${b.slug} leaderboard did not redirect to /gone (${goneDetail})`,
        });
      }
      if (signupInputs > 0) {
        findings.push({
          id: "F10",
          ac: "AC1",
          severity: "P0",
          detail: `archived ${b.slug} still renders a signup form on the public page`,
          screenshot: sGone,
        });
      }

      // unarchive restores B (scope to main — the archived-banner also has an
      // "Unarchive" button in the complementary region)
      await page.goto("/dashboard/settings/waitlists", { waitUntil: "load" });
      await page.getByRole("button", { name: /Archived \(1\)/ }).click();
      await page
        .getByRole("main")
        .getByRole("button", { name: "Unarchive", exact: true })
        .click();
      await expect(page.getByText(`${b.slug}.prewaitlist.com`)).toBeVisible({
        timeout: 10_000,
      });
      const sUnarch = await shot("19.6-unarchived-active");
      step(
        "AC1 — unarchive restores B",
        true,
        "B back in the active list",
        sUnarch
      );
    } catch (err) {
      fatal = (err as Error).message;
      step("fatal", false, fatal);
      try {
        const s = await shot("19.6-fatal");
        steps[steps.length - 1].screenshot = s;
      } catch {
        /* screenshot itself failed — keep the text detail */
      }
    } finally {
      // Founder gate: always hand the account back on FREE (19.5 convention).
      try {
        tierFlips.push(await setTier("free", userId));
      } catch (err) {
        findings.push({
          id: "F-restore",
          ac: "AC4",
          severity: "P1",
          detail: `failed to restore free tier: ${(err as Error).message}`,
        });
      }
    }

    // AC2 copy finding — record the modal headline verbatim for founder review
    const modalHeading = String(
      verbatim.freeHeaderModalHeading ?? verbatim.freeSwitcherModalHeading ?? ""
    );
    if (modalHeading) {
      findings.push({
        id: "F11",
        ac: "AC2",
        severity: "P2",
        detail: `Free 'Add new waitlist' opens the upgrade modal with headline "${modalHeading}" — off-context for a create-more-lists action (copy gate: cannot change without founder approval).`,
        verbatim: modalHeading,
        disposition: "deferred",
      });
    }

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(REPORT_DIR, "findings.json"),
      JSON.stringify(
        {
          story: "19.6",
          title: "Second-waitlist flow audit",
          ranAt: new Date().toISOString(),
          ok: fatal === null && steps.every((s) => s.ok),
          fatal,
          steps,
          findings,
          evidence: { verbatim, tierFlips },
        },
        null,
        2
      )
    );

    if (fatal) throw new Error(fatal);
  });
});
