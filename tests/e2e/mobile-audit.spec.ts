import { test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Story 19.5 — Mobile Responsiveness Audit harness.
 *
 * Captures viewport-only PNGs (AC1/AC2 evidence) + DOM-geometry checks at
 * 375×667 and 768×1024 for every screen listed in AC1, then writes an
 * auto-findings report to docs/qa/mobile-audit/findings.json.
 *
 * Run: npx playwright test tests/e2e/mobile-audit.spec.ts --reporter=list
 *
 * Screenshot prefix is 19.5- (21.2 owns NN-* names — do not collide).
 */

const SHOTS_DIR = path.join(process.cwd(), "docs", "qa", "screenshots");
const FINDINGS_DIR = path.join(process.cwd(), "docs", "qa", "mobile-audit");
const FINDINGS_PATH = path.join(FINDINGS_DIR, "findings.json");
const CRED_PATH = path.join(
  process.cwd(),
  "tests",
  "e2e",
  ".auth",
  "qa-credentials.json"
);

const VIEWPORTS = [
  { name: "375", width: 375, height: 667 },
  { name: "768", width: 768, height: 1024 },
] as const;

const QA_SUBDOMAIN = "qa-mobile";

interface ScreenSpec {
  id: string;
  url: string; // may contain {waitlistId} / {subscriberId} placeholders
  phase: "anon" | "auth";
}

/** AC1 — captured before login (public + auth + onboarding Phase A). */
const ANON_SCREENS: ScreenSpec[] = [
  { id: "marketing-home", url: "/", phase: "anon" },
  // Public subdomain pages must be captured via lvh.me host — on localhost
  // path form they hit updateSession's anon allowlist and bounce to /signin
  // (prod serves them on subdomain hosts, which take the rewrite branch).
  { id: "waitlist-minimal", url: "http://quality.lvh.me:3000/", phase: "anon" },
  { id: "waitlist-dark", url: "http://p.lvh.me:3000/", phase: "anon" },
  { id: "waitlist-bold", url: "http://pr.lvh.me:3000/", phase: "anon" },
  {
    id: "leaderboard-public",
    url: "http://quality.lvh.me:3000/leaderboard",
    phase: "anon",
  },
  { id: "gone-public", url: "http://quality.lvh.me:3000/gone", phase: "anon" },
  { id: "signup", url: "/signup", phase: "anon" },
  { id: "signin", url: "/signin", phase: "anon" },
  { id: "verify-email", url: "/verify-email", phase: "anon" },
  { id: "forgot-password", url: "/forgot-password", phase: "anon" },
  { id: "reset-password", url: "/reset-password", phase: "anon" },
  { id: "onboarding-1", url: "/onboarding/1", phase: "anon" },
  { id: "onboarding-2", url: "/onboarding/2", phase: "anon" },
  { id: "onboarding-3", url: "/onboarding/3", phase: "anon" },
];

/** AC1 — captured after login + seed while QA is free tier (dashboard + settings). */
const AUTH_FREE_SCREENS: ScreenSpec[] = [
  { id: "dashboard-home", url: "/dashboard", phase: "auth" },
  {
    id: "dashboard-qualification",
    url: "/dashboard/qualification",
    phase: "auth",
  },
  { id: "dashboard-leaderboard", url: "/dashboard/leaderboard", phase: "auth" },
  { id: "dashboard-warmth", url: "/dashboard/warmth", phase: "auth" },
  { id: "dashboard-updates", url: "/dashboard/updates", phase: "auth" },
  { id: "dashboard-broadcast", url: "/dashboard/broadcast", phase: "auth" },
  {
    id: "dashboard-subscriber-detail",
    url: "/dashboard/subscribers/{subscriberId}",
    phase: "auth",
  },
  { id: "settings-hub", url: "/dashboard/settings", phase: "auth" },
  {
    id: "settings-waitlists",
    url: "/dashboard/settings/waitlists",
    phase: "auth",
  },
  {
    id: "settings-waitlist-detail",
    url: "/dashboard/{waitlistId}/settings",
    phase: "auth",
  },
  { id: "settings-billing", url: "/dashboard/settings/billing", phase: "auth" },
  { id: "settings-profile", url: "/dashboard/settings/profile", phase: "auth" },
];

/**
 * Phase B onboarding screens — captured AFTER the mid-run tier flip to pro:
 * OnboardingGuard (src/components/auth/onboarding-guard.tsx) bounces
 * free-tier founders with ≥1 waitlist to /dashboard (by design, Epic 12.4),
 * so a free QA account can never reach these routes.
 */
const ONBOARDING_B_SCREENS: ScreenSpec[] = [
  { id: "onboarding-4", url: "/onboarding/4", phase: "auth" },
  { id: "onboarding-4a", url: "/onboarding/4a", phase: "auth" },
  { id: "onboarding-5", url: "/onboarding/5", phase: "auth" },
  { id: "onboarding-success", url: "/onboarding/success", phase: "auth" },
];

/** Captured after tier is flipped back to free (tier-independent page). */
const POST_SCREENS: ScreenSpec[] = [
  {
    // Page requires BOTH params (recovery card otherwise) — matches the real
    // email-capture-form redirect shape.
    id: "thank-you",
    url: `/${QA_SUBDOMAIN}/thank-you?subscriber_id={subscriberId}&referral_code={referralCode}`,
    phase: "auth",
  },
];

const AUTH_SCREENS = [
  ...AUTH_FREE_SCREENS,
  ...ONBOARDING_B_SCREENS,
  ...POST_SCREENS,
];

/** localStorage draft so Steps 1–3 + success render with realistic content. */
const DRAFT = {
  waitlistId: null,
  slug: QA_SUBDOMAIN,
  productName: "QA Mobile Audit",
  headline: "QA Mobile Audit",
  subheadline: "Test waitlist for mobile responsiveness evidence.",
  template: "minimal",
  brandColor: "#0F7A5E",
  logoUrl: null,
  ctaText: "Join waitlist",
  milestoneRewards: [],
  qualificationEnabled: false,
  questions: [],
  signupCounterEnabled: false,
  signupCounterThreshold: 10,
  emailSubject: "",
  emailSenderName: "",
  emailBody: "",
  phoneMode: "off",
  tier: "free",
  loading: false,
};

interface Geometry {
  innerWidth: number;
  scrollWidth: number;
  overflowX: boolean;
  offenders: {
    sel: string;
    left: number;
    right: number;
    w: number;
    h: number;
  }[];
  smallTargets: {
    sel: string;
    text: string;
    w: number;
    h: number;
    inline: boolean;
  }[];
  sticky: { sel: string; pos: string; top: number; h: number }[];
  clippedOverlays: {
    sel: string;
    top: number;
    bottom: number;
    vh: number;
    scrollable: boolean;
  }[];
  /** Page identity — trustworthy text signal when image delivery is unreliable. */
  identity: { title: string; headings: string[] };
  /** Fixed/sticky elements intersecting visible text/input elements. */
  fixedOverlaps: {
    fixedSel: string;
    targetSel: string;
    targetText: string;
    fixedBox: string;
    targetBox: string;
    overlapArea: number;
  }[];
}

interface Capture {
  screen: string;
  viewport: string;
  url: string;
  finalUrl: string;
  ok: boolean;
  error: string | null;
  screenshot: string | null;
  consoleErrors: string[];
  badResponses: { url: string; status: number }[];
  geometry: Geometry | null;
}

interface AutoFinding {
  screen: string;
  viewport: string;
  type:
    | "nav-failed"
    | "http-5xx"
    | "overflow"
    | "console-error"
    | "small-target"
    | "overlay-clip"
    | "fixed-overlap";
  severityHint: "P0-candidate" | "P1-candidate" | "P2";
  detail: string;
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

/** .env.local reader — the Playwright test process doesn't inherit Next's env. */
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

/**
 * Mid-run tier flip via Supabase REST (service key) — OnboardingGuard blocks
 * free+waitlist founders from /onboarding/4+ (by design), so Phase B captures
 * need the QA account temporarily on pro. Flipped back afterwards so re-runs
 * start from the same state.
 */
async function setTier(tier: "free" | "pro", userId: string): Promise<string> {
  const envLocal = loadEnvLocal();
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL || envLocal.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || envLocal.SUPABASE_SECRET_KEY;
  if (!base || !key) {
    throw new Error(
      "tier flip needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY"
    );
  }
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
  if (!res.ok)
    throw new Error(`tier flip → ${tier} failed: ${res.status()} ${body}`);
  const rows = JSON.parse(body || "[]");
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      `tier flip → ${tier}: no founder_profiles row for ${userId}`
    );
  }
  return `tier → ${tier} (${res.status})`;
}

/** Keep the localStorage draft's tier in sync so client-side guards agree. */
async function setDraftTier(page: Page, tier: "free" | "pro"): Promise<void> {
  await page.evaluate((t) => {
    const raw = window.localStorage.getItem("prewaitlist_onboarding");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { tier?: string };
      draft.tier = t;
      window.localStorage.setItem(
        "prewaitlist_onboarding",
        JSON.stringify(draft)
      );
    } catch {
      /* malformed draft — leave as-is */
    }
  }, tier);
}

async function collectGeometry(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const doc = document.documentElement;
    const desc = (el: Element): string => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const cls =
        typeof el.className === "string" && el.className
          ? "." + el.className.trim().split(/\s+/).slice(0, 4).join(".")
          : "";
      return `${tag}${id}${cls}`.slice(0, 140);
    };
    const isVisible = (el: Element): boolean => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        s.visibility !== "hidden" &&
        s.display !== "none" &&
        Number(s.opacity) > 0
      );
    };
    const inScrollX = (el: Element): boolean => {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
        p = p.parentElement;
      }
      return false;
    };

    const overflowX = doc.scrollWidth > vw + 1;
    const offenders: {
      sel: string;
      left: number;
      right: number;
      w: number;
      h: number;
    }[] = [];
    if (overflowX) {
      for (const el of Array.from(document.body.querySelectorAll("*"))) {
        if (inScrollX(el) || !isVisible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 || r.left < -1) {
          offenders.push({
            sel: desc(el),
            left: Math.round(r.left),
            right: Math.round(r.right),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
          if (offenders.length >= 60) break;
        }
      }
      // True horizontal-expanders (right edge past viewport, not off-canvas
      // sidebar at negative x) must surface first — DOM order floods with
      // closed-sidebar descendants otherwise.
      offenders.sort((a, b) => {
        const aExp = a.left >= -1 && a.right > vw + 1 ? 0 : 1;
        const bExp = b.left >= -1 && b.right > vw + 1 ? 0 : 1;
        if (aExp !== bExp) return aExp - bExp;
        return b.right - a.right;
      });
      offenders.length = Math.min(offenders.length, 12);
    }

    const smallTargets: {
      sel: string;
      text: string;
      w: number;
      h: number;
      inline: boolean;
    }[] = [];
    const interactive = document.body.querySelectorAll(
      "a,button,input,select,textarea,[role=button],[role=link]"
    );
    for (const el of Array.from(interactive)) {
      if (!isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height >= 44 && r.width >= 44) continue;
      const s = getComputedStyle(el);
      const label = (
        el.getAttribute("aria-label") ||
        el.textContent ||
        (el as HTMLInputElement).placeholder ||
        ""
      )
        .trim()
        .slice(0, 40);
      smallTargets.push({
        sel: desc(el),
        text: label,
        w: Math.round(r.width),
        h: Math.round(r.height),
        inline: s.display === "inline",
      });
      if (smallTargets.length >= 30) break;
    }

    const sticky: { sel: string; pos: string; top: number; h: number }[] = [];
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const s = getComputedStyle(el);
      if (s.position !== "fixed" && s.position !== "sticky") continue;
      if (!isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      sticky.push({
        sel: desc(el),
        pos: s.position,
        top: Math.round(r.top),
        h: Math.round(r.height),
      });
      if (sticky.length >= 10) break;
    }

    // Modal/dialog clip check: fixed backdrop (inset-0) whose card escapes the
    // viewport vertically and has no internal scroll = unreachable controls
    // (close button / secondary CTA) — matches the upgrade-modal @375 finding.
    const vh = window.innerHeight;
    const clippedOverlays: {
      sel: string;
      top: number;
      bottom: number;
      vh: number;
      scrollable: boolean;
    }[] = [];
    for (const ov of Array.from(document.body.querySelectorAll("div.fixed"))) {
      if (!ov.classList.contains("inset-0")) continue;
      if (!isVisible(ov)) continue;
      const card = ov.firstElementChild;
      if (!card) continue;
      const r = card.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const s = getComputedStyle(card);
      const scrollable = s.overflowY === "auto" || s.overflowY === "scroll";
      if (!scrollable && (r.top < -1 || r.bottom > vh + 1)) {
        clippedOverlays.push({
          sel: desc(card),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          vh,
          scrollable,
        });
      }
    }

    // Page identity: title + visible heading texts. Priority passes so the
    // <main> page heading surfaces before sidebar section overlines
    // (querySelectorAll returns document order, sidebar precedes main).
    const headings: string[] = [];
    const seenH = new Set<string>();
    const collect = (sel: string, limit: number) => {
      for (const el of Array.from(document.body.querySelectorAll(sel))) {
        if (headings.length >= limit) return;
        if (!isVisible(el)) continue;
        const t = (el.textContent || "").trim().replace(/\s+/g, " ");
        if (!t || seenH.has(t)) continue;
        seenH.add(t);
        headings.push(t.slice(0, 90));
      }
    };
    collect("main h1, main h2", 4);
    collect("h1, h2", 6);
    collect("h3, [class*=overline]", 8);

    // Fixed buttons (hamburger etc.) overlapping headings/inputs = collision.
    // Target rects use Range line boxes (glyph-tight): block elements like h1
    // span the full container width/line-height, which manufactures fake
    // overlaps with empty space next to the text.
    const tightRect = (el: Element): DOMRect => {
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = Array.from(range.getClientRects()).filter(
          (r) => r.width > 0 && r.height > 0
        );
        if (rects.length > 0) {
          let left = Infinity;
          let top = Infinity;
          let right = -Infinity;
          let bottom = -Infinity;
          for (const r of rects) {
            if (r.left < left) left = r.left;
            if (r.top < top) top = r.top;
            if (r.right > right) right = r.right;
            if (r.bottom > bottom) bottom = r.bottom;
          }
          return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top,
            x: left,
            y: top,
            toJSON() {
              return {};
            },
          } as DOMRect;
        }
      } catch {
        /* fall through */
      }
      return el.getBoundingClientRect();
    };
    const fixedOverlaps: {
      fixedSel: string;
      targetSel: string;
      targetText: string;
      fixedBox: string;
      targetBox: string;
      overlapArea: number;
    }[] = [];
    const fixedEls = Array.from(
      document.body.querySelectorAll(
        "button.fixed, a.fixed, div.fixed, [class*=fixed]"
      )
    ).filter((el) => {
      const s = getComputedStyle(el);
      return s.position === "fixed" && isVisible(el);
    });
    const targets = Array.from(
      document.body.querySelectorAll("h1, h2, h3, p, span, a, button, label")
    ).filter((el) => {
      if (!isVisible(el)) return false;
      const t = (el.textContent || "").trim();
      if (!t || t.length < 2) return false;
      // skip descendants of a fixed element (self-overlap)
      for (const f of fixedEls) if (f.contains(el)) return false;
      return true;
    });
    for (const f of fixedEls) {
      const fr = f.getBoundingClientRect();
      if (fr.width < 4 || fr.height < 4) continue;
      if (fr.top < -500 || fr.left < -500) continue;
      // skip full-screen backdrops/overlays (inset-0 modals) — they cover all
      if (f.classList.contains("inset-0")) continue;
      if (fr.width >= vw * 0.9 && fr.height >= vh * 0.9) continue;
      for (const t of targets) {
        const tr = tightRect(t);
        const ox = Math.min(fr.right, tr.right) - Math.max(fr.left, tr.left);
        const oy = Math.min(fr.bottom, tr.bottom) - Math.max(fr.top, tr.top);
        if (ox > 2 && oy > 2) {
          const box = (r: DOMRect) =>
            `x=${Math.round(r.left)}..${Math.round(r.right)} y=${Math.round(r.top)}..${Math.round(r.bottom)}`;
          fixedOverlaps.push({
            fixedSel: desc(f),
            targetSel: desc(t),
            targetText: (t.textContent || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 50),
            fixedBox: box(fr),
            targetBox: box(tr),
            overlapArea: Math.round(ox * oy),
          });
          if (fixedOverlaps.length >= 8) break;
        }
      }
      if (fixedOverlaps.length >= 8) break;
    }

    return {
      innerWidth: vw,
      scrollWidth: doc.scrollWidth,
      overflowX,
      offenders,
      smallTargets,
      sticky,
      clippedOverlays,
      identity: { title: document.title, headings },
      fixedOverlaps,
    };
  });
}

test.describe("19.5 mobile responsiveness audit", () => {
  test("capture all AC1 screens at 375 and 768", async ({ page }) => {
    test.setTimeout(15 * 60_000);
    page.setDefaultTimeout(15_000);

    fs.mkdirSync(SHOTS_DIR, { recursive: true });
    fs.mkdirSync(FINDINGS_DIR, { recursive: true });

    await page.addInitScript((draft) => {
      window.localStorage.setItem(
        "prewaitlist_onboarding",
        JSON.stringify(draft)
      );
    }, DRAFT);

    const captures: Capture[] = [];
    const autoFindings: AutoFinding[] = [];

    const capture = async (
      screen: ScreenSpec,
      vp: (typeof VIEWPORTS)[number],
      ids: {
        waitlistId: string;
        subscriberId: string;
        referralCode: string;
      }
    ): Promise<void> => {
      const url = screen.url
        .replace("{waitlistId}", ids.waitlistId)
        .replace("{subscriberId}", ids.subscriberId)
        .replace("{referralCode}", ids.referralCode);
      const consoleErrors: string[] = [];
      const badResponses: { url: string; status: number }[] = [];
      const onPageError = (err: Error) => consoleErrors.push(err.message);
      const onResponse = (res: { status(): number; url(): string }) => {
        if (res.status() >= 400) {
          badResponses.push({ url: res.url(), status: res.status() });
        }
      };
      page.on("pageerror", onPageError);
      page.on("response", onResponse);

      const shotRel = path.join(
        "docs",
        "qa",
        "screenshots",
        `19.5-${screen.id}-${vp.name}.png`
      );
      let geometry: Geometry | null = null;
      let ok = true;
      let error: string | null = null;
      let finalUrl = url;

      try {
        await page.goto(url, { waitUntil: "load", timeout: 30_000 });
        await page
          .waitForLoadState("networkidle", { timeout: 5_000 })
          .catch(() => undefined);
        await page.waitForTimeout(500);
        finalUrl = page.url();
        geometry = await collectGeometry(page);
        await page.screenshot({
          path: path.join(process.cwd(), shotRel),
          scale: "css",
        });
      } catch (err) {
        ok = false;
        error = err instanceof Error ? err.message : String(err);
        try {
          await page.screenshot({
            path: path.join(process.cwd(), shotRel),
            scale: "css",
          });
        } catch {
          error += " (screenshot also failed)";
        }
      } finally {
        page.off("pageerror", onPageError);
        page.off("response", onResponse);
      }

      captures.push({
        screen: screen.id,
        viewport: vp.name,
        url,
        finalUrl,
        ok,
        error,
        screenshot: ok ? shotRel : shotRel,
        consoleErrors,
        badResponses,
        geometry,
      });

      if (!ok) {
        autoFindings.push({
          screen: screen.id,
          viewport: vp.name,
          type: "nav-failed",
          severityHint: "P0-candidate",
          detail: error ?? "navigation failed",
        });
      }
      for (const res of badResponses) {
        if (res.status >= 500) {
          autoFindings.push({
            screen: screen.id,
            viewport: vp.name,
            type: "http-5xx",
            severityHint: "P0-candidate",
            detail: `${res.status} ${res.url}`,
          });
        }
      }
      if (geometry) {
        if (geometry.overflowX) {
          autoFindings.push({
            screen: screen.id,
            viewport: vp.name,
            type: "overflow",
            severityHint: "P1-candidate",
            detail: `scrollWidth ${geometry.scrollWidth} > ${geometry.innerWidth}; offenders: ${geometry.offenders
              .map((o) => `${o.sel} (r=${o.right})`)
              .join(", ")}`,
          });
        }
        for (const o of geometry.clippedOverlays) {
          autoFindings.push({
            screen: screen.id,
            viewport: vp.name,
            type: "overlay-clip",
            severityHint: "P1-candidate",
            detail: `card ${o.sel} spans ${o.top}..${o.bottom} in ${o.vh}px viewport, no internal scroll — top/bottom controls clipped`,
          });
        }
        for (const o of geometry.fixedOverlaps) {
          autoFindings.push({
            screen: screen.id,
            viewport: vp.name,
            type: "fixed-overlap",
            severityHint:
              o.overlapArea >= 300 ? "P1-candidate" : "P2-candidate",
            detail:
              `${o.fixedSel} [${o.fixedBox}] overlaps "${o.targetText}" ` +
              `(${o.targetSel} [${o.targetBox}]) by ${o.overlapArea}px²`,
          });
        }
        for (const msg of consoleErrors) {
          autoFindings.push({
            screen: screen.id,
            viewport: vp.name,
            type: "console-error",
            severityHint: "P1-candidate",
            detail: msg.slice(0, 300),
          });
        }
        for (const t of geometry.smallTargets) {
          if (t.inline && Math.min(t.w, t.h) >= 32) continue;
          autoFindings.push({
            screen: screen.id,
            viewport: vp.name,
            type: "small-target",
            severityHint: "P2",
            detail: `${t.sel} "${t.text}" ${t.w}×${t.h}${t.inline ? " (inline)" : ""}`,
          });
        }
      }
    };

    // ---- Phase A: anon screens (public, auth pages, onboarding 1–3) ----
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const screen of ANON_SCREENS) {
        await capture(screen, vp, { waitlistId: "", subscriberId: "" });
      }
    }

    // ---- Phase B: login + seed QA waitlist + subscribers ----
    const creds = readCredentials();
    await page.setViewportSize({
      width: VIEWPORTS[0].width,
      height: VIEWPORTS[0].height,
    });
    await page.goto("/signin", { waitUntil: "load" });
    await page.fill('input[name="email"]', creds.email);
    await page.fill('input[name="password"]', creds.password);
    await Promise.all([
      page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 30_000 }),
      page.click('button[type="submit"]'),
    ]);

    const api = page.context().request;
    let waitlistId = "";
    let subscriberId = "";

    const listRes = await api.get("/api/waitlist");
    const list = listRes.ok() ? await listRes.json() : [];
    // GET maps rows to camelCase: { waitlistId, slug, ... } — no raw id/subdomain.
    const existing = Array.isArray(list)
      ? list.find(
          (w: { slug?: string; subdomain?: string }) =>
            w.slug === QA_SUBDOMAIN || w.subdomain === QA_SUBDOMAIN
        )
      : undefined;

    if (existing) {
      waitlistId =
        (existing.waitlistId as string | undefined) ??
        (existing.id as string | undefined) ??
        "";
    }
    if (!waitlistId) {
      const createRes = await api.post("/api/waitlist", {
        data: {
          subdomain: QA_SUBDOMAIN,
          headline: DRAFT.headline,
          subheadline: DRAFT.subheadline,
          product_name: DRAFT.productName,
          template: "minimal",
        },
      });
      if (!createRes.ok()) {
        throw new Error(
          `waitlist seed failed: ${createRes.status()} ${await createRes.text()} ` +
            `(GET /api/waitlist: ${listRes.status()} ${JSON.stringify(list).slice(0, 200)})`
        );
      }
      waitlistId = (await createRes.json()).id as string;
    }

    const seedReport: string[] = [];
    let referralCode = "";
    for (let i = 1; i <= 5; i++) {
      const res = await api.post("/api/subscribers", {
        data: {
          waitlist_id: waitlistId,
          email: `qa-sub-${i}@example.com`,
          ts: Date.now() - 5000,
        },
      });
      if (res.ok()) {
        const body = await res.json();
        if (!subscriberId) subscriberId = body.id as string;
        if (!referralCode && body.referral_code)
          referralCode = body.referral_code as string;
        seedReport.push(`qa-sub-${i}: 201`);
      } else {
        seedReport.push(
          `qa-sub-${i}: ${res.status()} (dup/limited ok on re-run)`
        );
      }
    }

    // Fallback: pull a subscriber id from the dashboard leaderboard anchors.
    if (!subscriberId) {
      await page.goto("/dashboard/leaderboard", { waitUntil: "load" });
      const href = await page
        .locator('a[href^="/dashboard/subscribers/"]')
        .first()
        .getAttribute("href");
      if (href) subscriberId = href.split("/").pop() ?? "";
    }
    if (!subscriberId) {
      throw new Error("no subscriber id — dashboard detail capture impossible");
    }

    // The thank-you page needs the subscriber's own referral_code too.
    if (!referralCode) {
      const subRes = await api.get(`/api/subscribers/${subscriberId}`);
      if (subRes.ok()) {
        referralCode = ((await subRes.json()).referral_code as string) ?? "";
      }
      if (!referralCode) {
        throw new Error("no referral code — thank-you capture impossible");
      }
    }

    // ---- Phase B1: auth screens on FREE tier (dashboard + settings) ----
    const ids = { waitlistId, subscriberId, referralCode };
    const flipLog: string[] = [];
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const screen of AUTH_FREE_SCREENS) {
        await capture(screen, vp, ids);
      }
    }

    // ---- Phase B2: flip free → pro, capture Phase B onboarding ----
    if (!creds.id) {
      throw new Error("qa-credentials.json missing id — cannot flip tier");
    }
    flipLog.push(await setTier("pro", creds.id));
    await setDraftTier(page, "pro");
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const screen of ONBOARDING_B_SCREENS) {
        await capture(screen, vp, ids);
      }
    }

    // ---- Phase B3: flip back to free, capture remaining screens ----
    flipLog.push(await setTier("free", creds.id));
    await setDraftTier(page, "free");
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const screen of POST_SCREENS) {
        await capture(screen, vp, ids);
      }
    }

    // ---- Write findings report ----
    const report = {
      generatedAt: new Date().toISOString(),
      viewports: VIEWPORTS,
      screens: [...ANON_SCREENS, ...AUTH_SCREENS].map((s) => s.id),
      seed: {
        waitlistId,
        subscriberId,
        subdomain: QA_SUBDOMAIN,
        report: seedReport,
        tierFlips: flipLog,
      },
      captureCount: captures.length,
      captures,
      autoFindings,
    };
    fs.writeFileSync(FINDINGS_PATH, JSON.stringify(report, null, 2), "utf8");

    console.log(
      `[19.5] ${captures.length} captures, ${autoFindings.length} auto-findings → ${FINDINGS_PATH}`
    );
    for (const f of autoFindings) {
      console.log(
        `  [${f.severityHint}] ${f.screen}@${f.viewport} ${f.type}: ${f.detail.slice(0, 160)}`
      );
    }
  });
});
