"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { driver, type Config, type Driver, type Side } from "driver.js";
import "driver.js/dist/driver.css";
import { setSurveySuppressed } from "@/lib/analytics";

export const TOUR_FLAG_KEY = "founder-dashboard-tour-complete";
export const TOUR_REPLAY_EVENT = "prewaitlist-tour-replay";

const FIRST_TARGET = '[data-tour="dashboard-header"]';
const SIDEBAR_TARGET = '[data-tour="dashboard-sidebar"]';
const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 15_000;
const STEP_WAIT_MS = 3000;

interface TourStepSpec {
  element: string;
  side: Side;
  title: string;
  description: string;
}

// Story 20.2 AC5: copy approved verbatim by the founder (2026-10-04).
// Order: header/link → stat cards → chart → warmth → qualification → sidebar.
const STEPS: TourStepSpec[] = [
  {
    element: '[data-tour="dashboard-header"]',
    side: "bottom",
    title: "Your waitlist is live",
    description:
      "Your public page is live. Share this link where your audience already is — signups land here.",
  },
  {
    element: '[data-tour="stat-cards"]',
    side: "bottom",
    title: "Overview",
    description:
      "Total signups, referral share, today's growth, and subscriber warmth — all in one row.",
  },
  {
    element: '[data-tour="signup-chart"]',
    side: "bottom",
    title: "Signups Over Time",
    description:
      "Watch momentum build. The trend line updates as new subscribers join.",
  },
  {
    element: '[data-tour="warmth-panel"]',
    side: "top",
    title: "Warmth Distribution",
    description:
      "See who's engaged: Hot, Warm, and Cold — target broadcasts to the right people.",
  },
  {
    element: '[data-tour="qualification-panel"]',
    side: "top",
    title: "Qualification Breakdown",
    description:
      "See how subscribers answered your questions — your best leads stand out.",
  },
  {
    element: SIDEBAR_TARGET,
    side: "right",
    title: "Your toolkit",
    description:
      "Leaderboard, updates, broadcast, and settings — everything else lives in the sidebar.",
  },
];

export function DashboardTour({
  subscriberCount,
}: {
  subscriberCount: number;
}) {
  const pathname = usePathname();
  const driverRef = useRef<Driver | null>(null);
  const unmountingRef = useRef(false);
  const countRef = useRef(subscriberCount);

  // Keep the count fresh without re-running the tour effect — a mid-tour
  // subscriber_count refresh (router.refresh) must not restart the tour.
  useEffect(() => {
    countRef.current = subscriberCount;
  }, [subscriberCount]);

  useEffect(() => {
    unmountingRef.current = false;
    if (pathname !== "/dashboard") return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    // Story 20.2 AC7: below lg the sidebar drawer is off-canvas, so the
    // sidebar step is omitted (remaining steps highlight real elements).
    const isDesktop =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(min-width: 1024px)").matches
        : true;
    const visibleSteps = isDesktop
      ? STEPS
      : STEPS.filter((step) => step.element !== SIDEBAR_TARGET);

    const startTour = (force: boolean) => {
      if (driverRef.current?.isActive()) return;
      if (countRef.current < 1) return;
      if (!force && window.localStorage.getItem(TOUR_FLAG_KEY)) return;

      const config: Config = {
        steps: visibleSteps,
        showProgress: true,
        skipMissingElement: true,
        waitForElement: STEP_WAIT_MS,
        onPopoverRender: (popover) => {
          const skip = document.createElement("button");
          skip.type = "button";
          skip.className = "driver-popover-footer-btn";
          skip.textContent = "Skip";
          skip.addEventListener("click", () => driverRef.current?.destroy());
          popover.footerButtons.appendChild(skip);
        },
        onDestroyed: () => {
          // Cleanup-triggered destroy (unmount, StrictMode double-invoke,
          // navigation) must not write the flag or the tour never runs in
          // development and navigation silently counts as completion.
          if (unmountingRef.current) return;
          try {
            window.localStorage.setItem(TOUR_FLAG_KEY, "1");
          } catch {
            // storage unavailable (private mode) — tour replays next visit
          }
          setSurveySuppressed(false);
          driverRef.current = null;
        },
      };
      const driverObj = driver(config);
      driverRef.current = driverObj;
      setSurveySuppressed(true);
      driverObj.drive();
    };

    // Story 20.2 AC6: start only once the first target is in the DOM —
    // while loading.tsx renders the skeleton no tour targets exist. Poll,
    // then give up silently (retries on the next /dashboard visit).
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    const attemptAutoStart = () => {
      if (cancelled) return;
      if (countRef.current < 1) return;
      if (window.localStorage.getItem(TOUR_FLAG_KEY)) return;
      if (document.querySelector(FIRST_TARGET)) {
        startTour(false);
        return;
      }
      if (Date.now() >= deadline) return;
      pollTimer = setTimeout(attemptAutoStart, POLL_INTERVAL_MS);
    };
    attemptAutoStart();

    const onReplay = () => {
      if (cancelled) return;
      startTour(true);
    };
    window.addEventListener(TOUR_REPLAY_EVENT, onReplay);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      window.removeEventListener(TOUR_REPLAY_EVENT, onReplay);
      unmountingRef.current = true;
      setSurveySuppressed(false);
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [pathname]);

  return null;
}
