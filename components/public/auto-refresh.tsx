"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Re-fetches the current route's server payload so an open subscriber tab
// picks up newly published founder updates without a manual reload. Mirrors
// the dashboard auto-refresh pattern (Story 12.2.12): 60s interval + refresh
// on become-visible, both skipped while the tab is hidden or unmounted.
// router.refresh() merges the RSC payload without losing client state
// (Next.js docs) — in-progress signup-form input survives.
export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-refresh: re-fetch data when tab regains focus
  useEffect(() => {
    function handleVisibilityChange() {
      if (mountedRef.current && document.visibilityState === "visible") {
        router.refresh();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  // Auto-refresh: re-fetch data every interval while tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (mountedRef.current && document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
