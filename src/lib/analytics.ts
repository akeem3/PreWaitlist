export type CaptureProperties = Record<
  string,
  string | number | boolean | null
>;

export interface CaptureOptions {
  /**
   * Marks events that trigger PostHog surveys. Suppressed while the
   * upgrade modal (or, later, the dashboard walkthrough) is open so
   * survey popups never stack on top of modals (Story 20.1, D7).
   */
  surveyTrigger?: boolean;
}

type PostHogClient = typeof import("posthog-js").default;

type QueuedAction =
  | { kind: "capture"; event: string; properties?: CaptureProperties }
  | { kind: "identify"; id: string; properties?: CaptureProperties }
  | { kind: "register"; properties: CaptureProperties };

/**
 * Max buffered actions while the SDK is loading. Bounds memory if the
 * `posthog-js` chunk never arrives (offline/blocked) on a long-lived page.
 */
const MAX_QUEUE = 50;

/** requestIdleCallback timeout — hard ceiling so analytics always loads. */
const IDLE_TIMEOUT_MS = 3000;

/** Fallback delay where requestIdleCallback is unavailable (e.g. happy-dom). */
const FALLBACK_DELAY_MS = 1200;

/** Safety net if the first-contentful-paint entry never arrives. */
const FIRST_PAINT_TIMEOUT_MS = 2500;

let initialized = false;
let enabled = false;
let ready = false;
let surveySuppressed = false;
let client: PostHogClient | null = null;
const queue: QueuedAction[] = [];

function scheduleIdle(fn: () => void): void {
  if (typeof window === "undefined") return;

  const requestIdle = (
    window as unknown as {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number;
    }
  ).requestIdleCallback;

  if (typeof requestIdle === "function") {
    requestIdle(fn, { timeout: IDLE_TIMEOUT_MS });
    return;
  }

  window.setTimeout(fn, FALLBACK_DELAY_MS);
}

/**
 * Run `fn` only after the browser has painted something. requestIdleCallback
 * alone is not enough — it can fire while the page is still blocked before
 * first paint, which would put the SDK back on the critical path (measured
 * 1460 ms FCP in dev vs 296 ms with analytics blocked, 2026-10-19).
 */
function scheduleAfterFirstPaint(fn: () => void): void {
  if (typeof window === "undefined") return;

  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    fn();
  };

  if (typeof PerformanceObserver === "function") {
    try {
      const observer = new PerformanceObserver((list) => {
        if (
          list
            .getEntries()
            .some((entry) => entry.name === "first-contentful-paint")
        ) {
          observer.disconnect();
          run();
        }
      });
      observer.observe({ type: "paint", buffered: true });
      window.setTimeout(() => {
        try {
          observer.disconnect();
        } catch {
          // ignore
        }
        run();
      }, FIRST_PAINT_TIMEOUT_MS);
      return;
    } catch {
      // Fall through to the plain timeout.
    }
  }

  window.setTimeout(run, FALLBACK_DELAY_MS);
}

async function loadAndInit(key: string): Promise<void> {
  try {
    const { default: posthog } = await import("posthog-js");

    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
    posthog.init(key, {
      api_host: host,
      // Story 20.1 D4 — official PostHog defaults preset (autocapture ON,
      // pageviews, sampled session replay within the free-tier budget).
      defaults: "2026-05-30",
    });

    client = posthog;
    ready = true;

    const pending = queue.splice(0, queue.length);
    for (const action of pending) {
      if (action.kind === "capture") {
        posthog.capture(action.event, action.properties);
      } else if (action.kind === "identify") {
        posthog.identify(action.id, action.properties);
      } else {
        posthog.register(action.properties);
      }
    }
  } catch {
    // Never break the app if the SDK fails to load.
  }
}

/**
 * Story 20.1 AC1 — initialize PostHog from instrumentation-client.ts.
 * No-op when NEXT_PUBLIC_POSTHOG_KEY is absent (local dev must not error).
 *
 * Performance (2026-10-19 investigation): the SDK is code-split and only
 * fetched after the page has painted (see scheduleAfterFirstPaint), so the
 * ~118 KB `posthog-js` bundle and the extensions it loads from PostHog's CDN
 * (session replay, surveys) stay off the critical path. Nothing is lost —
 * events fired before the SDK is ready are buffered and flushed in order.
 * Resolves when init + flush finish.
 */
export function initAnalytics(): Promise<void> {
  if (initialized) return Promise.resolve();
  initialized = true;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return Promise.resolve();

  enabled = true;

  return new Promise<void>((resolve) => {
    scheduleAfterFirstPaint(() => {
      scheduleIdle(() => {
        void loadAndInit(key).then(resolve, resolve);
      });
    });
  });
}

function enqueue(action: QueuedAction): void {
  if (queue.length >= MAX_QUEUE) return;
  queue.push(action);
}

/**
 * Safe capture for every call site. Never throws, never sends when the
 * SDK is uninitialized (tests, local dev without a key). Never pass
 * subscriber PII in `properties` (Story 20.1 AC3).
 */
export function capture(
  event: string,
  properties?: CaptureProperties,
  options?: CaptureOptions
): void {
  if (!enabled) return;
  if (options?.surveyTrigger && surveySuppressed) return;
  if (!ready || !client) {
    enqueue({ kind: "capture", event, properties });
    return;
  }
  client.capture(event, properties);
}

/** Story 20.1 D6 — tie all dashboard events to the signed-in founder. */
export function identifyFounder(
  founderId: string,
  properties?: CaptureProperties
): void {
  if (!enabled) return;
  if (!ready || !client) {
    enqueue({ kind: "identify", id: founderId, properties });
    return;
  }
  client.identify(founderId, properties);
}

/** Context attached to every subsequent event (tier, waitlist_id — AC3). */
export function registerContext(properties: CaptureProperties): void {
  if (!enabled) return;
  if (!ready || !client) {
    enqueue({ kind: "register", properties });
    return;
  }
  client.register(properties);
}

/** Story 20.1 D7 — gate survey-trigger events while a modal owns the UI. */
export function setSurveySuppressed(suppressed: boolean): void {
  surveySuppressed = suppressed;
}
