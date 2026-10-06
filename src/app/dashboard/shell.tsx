"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import { Sidebar } from "../../../components/dashboard/sidebar";
import { UpgradeModal } from "../../../components/dashboard/upgrade-modal";
import { QuotaWarningBanner } from "../../../components/dashboard/quota-warning-banner";
import { useRouter, useSearchParams } from "next/navigation";
import { STORAGE_KEY } from "../../../components/dashboard/waitlist-switcher";
import { resolveActiveWaitlist } from "../../lib/active-waitlist";
import { capture, identifyFounder, registerContext } from "@/lib/analytics";
import { DashboardTour } from "../../../components/dashboard/tour";

interface WaitlistRow {
  id: string;
  subdomain: string;
  product_name: string | null;
  logo_url: string | null;
  is_archived: boolean;
  // Optional: dashboard-layout select includes it for analytics person props
  // (Story 20.1 D6); test fixtures predate the column and stay valid.
  subscriber_count?: number | null;
}

// Story 20.1 D2 — client-side tier-flip captures for the dashboard context
// (the onboarding checkout poll owns its own via use-paddle-upgrade).
// Known limitation, recorded in the story Dev Notes: a Paddle-portal
// cancellation with no dashboard tab open is never observed here.
function recordTierFlip(prev: string, next: string): void {
  if (next === "pro") {
    capture("subscription_started", { source: "dashboard" });
  } else if (prev === "pro") {
    capture("cancelled", { source: "tier_flip" });
  }
}

interface DashboardContextValue {
  tier: string;
  activeWaitlistId: string;
  setUpgradeModal: (value: { open: boolean; triggerSource: string }) => void;
  refreshTier: () => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextValue | null>(
  null
);

export function useDashboardTier(): string | null {
  const ctx = useContext(DashboardContext);
  return ctx?.tier ?? null;
}

export function useRefreshTier(): (() => Promise<void>) | null {
  const ctx = useContext(DashboardContext);
  return ctx?.refreshTier ?? null;
}

export function useActiveWaitlistId(): string | null {
  const ctx = useContext(DashboardContext);
  return ctx?.activeWaitlistId ?? null;
}

export function useUpgradeModal() {
  const ctx = useContext(DashboardContext);
  return useCallback(
    (triggerSource: string) => {
      if (ctx?.setUpgradeModal) {
        ctx.setUpgradeModal({ open: true, triggerSource });
      }
    },
    [ctx]
  );
}

interface DashboardShellProps {
  children: React.ReactNode;
  waitlists: WaitlistRow[];
  tier: string;
  /** Story 20.1 D6 — signed-in founder id for PostHog identify; optional so
   *  tests can render the shell without analytics. */
  founderId?: string;
}

function getStoredId(waitlists: WaitlistRow[]): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && waitlists.some((w) => w.id === stored)) return stored;
  } catch {}
  return null;
}

const TIER_POLL_INTERVAL_MS = 2000;
const TIER_POLL_MAX_MS = 60_000;
const TIER_CHANNEL_NAME = "prewaitlist-tier";

export default function DashboardShell({
  children,
  waitlists,
  tier: serverTier,
  founderId,
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    triggerSource: string;
  }>({ open: false, triggerSource: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeWaitlistId, setActiveWaitlistId] = useState(
    () => resolveActiveWaitlist(waitlists)?.id ?? ""
  );
  const [tier, setTierState] = useState(serverTier);
  const tierRef = useRef(serverTier);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTier = useCallback((next: string) => {
    const prev = tierRef.current;
    if (prev === next) return;
    tierRef.current = next;
    setTierState(next);
    recordTierFlip(prev, next);
  }, []);

  // Accept server-prop updates (router.refresh / navigation). Client-applied
  // values already match the DB when we set them, so this is a no-op in the
  // common case and catches external refreshes (e.g. overview visibility).
  // Story 20.1: also records tier flips — this is the path a webhook-driven
  // change takes while the tab is open (applyTier is bypassed here).
  useEffect(() => {
    if (serverTier !== tierRef.current) {
      const prev = tierRef.current;
      tierRef.current = serverTier;
      setTierState(serverTier);
      recordTierFlip(prev, serverTier);
    }
  }, [serverTier]);

  const stopTierPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  const fetchTier = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.tier === "string" ? data.tier : null;
    } catch {
      return null;
    }
  }, []);

  const refreshTier = useCallback(async () => {
    const next = await fetchTier();
    if (next && next !== tierRef.current) {
      applyTier(next);
      window.dispatchEvent(
        new CustomEvent("tier-changed", { detail: { tier: next } })
      );
      router.refresh();
    }
  }, [fetchTier, applyTier, router]);

  const broadcastTier = useCallback((next: string) => {
    try {
      const channel = new BroadcastChannel(TIER_CHANNEL_NAME);
      channel.postMessage({ tier: next });
      channel.close();
    } catch {
      // BroadcastChannel unavailable
    }
  }, []);

  const startTierPolling = useCallback(() => {
    stopTierPolling();

    pollingRef.current = setInterval(async () => {
      const next = await fetchTier();
      if (next && next !== tierRef.current) {
        applyTier(next);
        stopTierPolling();
        broadcastTier(next);
        router.refresh();
      }
    }, TIER_POLL_INTERVAL_MS);

    pollingTimeoutRef.current = setTimeout(() => {
      stopTierPolling();
    }, TIER_POLL_MAX_MS);
  }, [stopTierPolling, fetchTier, applyTier, broadcastTier, router]);

  // Sync from URL param or localStorage after hydration (client-only).
  // Server renders with the last waitlist; client hydrates the same, then
  // corrects to the stored preference. 4.4: shared precedence — ?wid >
  // stored > newest (same value as current state in the fallback case, so
  // React bails out with no extra render).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const wid = searchParams.get("wid");
    const stored = getStoredId(waitlists);
    const resolved = resolveActiveWaitlist(waitlists, {
      wid,
      storedId: stored,
    });
    if (resolved) {
      setActiveWaitlistId(resolved.id);
    }
  }, [searchParams, waitlists]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Self-heal: if the URL points at a waitlist the (possibly stale, cached)
  // layout payload doesn't include, re-run the server layout once so the
  // fresh waitlists array arrives and the wid resolves. Ref-guarded so it
  // fires at most once per unknown wid.
  const widRefreshRef = useRef<string | null>(null);
  useEffect(() => {
    const wid = searchParams.get("wid");
    if (
      wid &&
      !waitlists.some((w) => w.id === wid) &&
      widRefreshRef.current !== wid
    ) {
      widRefreshRef.current = wid;
      router.refresh();
    }
  }, [searchParams, waitlists, router]);

  // Global tier refresh: checkout return, post-checkout polling, cross-tab.
  useEffect(() => {
    const onCheckoutOpened = () => startTierPolling();

    const onTierChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ tier?: string }>).detail;
      if (detail?.tier && detail.tier !== tierRef.current) {
        applyTier(detail.tier);
        broadcastTier(detail.tier);
        router.refresh();
      }
    };

    window.addEventListener("paddle-checkout-opened", onCheckoutOpened);
    window.addEventListener("tier-changed", onTierChanged);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(TIER_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<{ tier?: string }>) => {
        if (event.data?.tier && event.data.tier !== tierRef.current) {
          applyTier(event.data.tier);
          router.refresh();
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }

    return () => {
      window.removeEventListener("paddle-checkout-opened", onCheckoutOpened);
      window.removeEventListener("tier-changed", onTierChanged);
      stopTierPolling();
      try {
        channel?.close();
      } catch {}
    };
  }, [startTierPolling, stopTierPolling, applyTier, broadcastTier, router]);

  // Paddle successUrl return: ?upgraded=1 on any dashboard route (mount-only).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("upgraded") === "1") {
        startTierPolling();
        params.delete("upgraded");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (qs ? `?${qs}` : "")
        );
      }
    } catch {}
  }, [startTierPolling]);

  // Cap-warning email deep link: ?upgrade=cap opens the Pro modal with the
  // subscriber-cap trigger (mount-only). Honors the 1-day dismiss cooldown
  // via the modal itself.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("upgrade") === "cap") {
        setUpgradeModal({ open: true, triggerSource: "subscriber_cap" });
        params.delete("upgrade");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (qs ? `?${qs}` : "")
        );
      }
    } catch {}
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const effectiveId = activeWaitlistId;

  const activeWaitlist = waitlists.find((w) => w.id === effectiveId);

  // Story 20.1 D6 — identify the signed-in founder and keep person props +
  // event super-properties current (tier flips, waitlist switches, refreshed
  // subscriber_count). identify with the same distinct_id is PostHog's
  // supported way to update a person — no duplicate profiles. Fresh person
  // props matter: Survey 1 ("after first subscriber") targets subscriber_count.
  // founderId optional so tests can render the shell without analytics.
  useEffect(() => {
    if (!founderId) return;
    const props = {
      tier,
      waitlist_id: effectiveId || null,
      subscriber_count: activeWaitlist?.subscriber_count ?? 0,
    };
    registerContext(props);
    identifyFounder(founderId, props);
  }, [founderId, tier, effectiveId, activeWaitlist]);

  const handleSelectWaitlist = useCallback(
    (waitlistId: string) => {
      setActiveWaitlistId(waitlistId);
      try {
        localStorage.setItem(STORAGE_KEY, waitlistId);
      } catch {}
      router.push(`/dashboard?wid=${waitlistId}`);
    },
    [router]
  );

  // Story 19.4 C19 row: unarchive must not refresh as if it succeeded, and
  // the banner button needs pending + error states (was silent).
  const [unarchiveError, setUnarchiveError] = useState<string | null>(null);
  const [unarchivePending, setUnarchivePending] = useState(false);

  async function handleUnarchive() {
    if (!effectiveId) return;
    setUnarchivePending(true);
    setUnarchiveError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: effectiveId,
          is_archived: false,
          archived_at: null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setUnarchiveError(
          data?.error || "Something went wrong. Please try again."
        );
        return;
      }
      router.refresh();
    } catch {
      setUnarchiveError("Something went wrong. Please try again.");
    } finally {
      setUnarchivePending(false);
    }
  }

  function handleUpgradeClick(triggerSource: string) {
    setUpgradeModal({ open: true, triggerSource });
  }

  const contextValue = {
    tier,
    activeWaitlistId: effectiveId,
    setUpgradeModal: (v: { open: boolean; triggerSource: string }) =>
      setUpgradeModal(v),
    refreshTier,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        waitlists={waitlists}
        activeWaitlistId={effectiveId}
        onSelectWaitlist={handleSelectWaitlist}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tier={tier}
        isArchived={activeWaitlist?.is_archived ?? false}
        onUnarchive={handleUnarchive}
        unarchiveError={unarchiveError}
        unarchivePending={unarchivePending}
        onUpgradeClick={handleUpgradeClick}
      />

      <UpgradeModal
        open={upgradeModal.open}
        onOpenChange={(open) => setUpgradeModal((prev) => ({ ...prev, open }))}
        triggerSource={upgradeModal.triggerSource}
      />

      <button
        type="button"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 rounded-lg border border-border bg-card p-2 lg:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5H17M3 10H17M3 15H17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* pt-14 below lg clears the fixed hamburger zone (top-4 left-4 →
          bottom edge y=54): page headings/back-links start below it instead
          of under it. lg:pt-0 keeps desktop layout unchanged (no hamburger). */}
      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-67">
        <QuotaWarningBanner />
        <DashboardContext.Provider value={contextValue}>
          {children}
        </DashboardContext.Provider>
        {/* Renders null; children effects (page captures) run before the
            tour's effect so Survey 1 eligibility sees dashboard_viewed. */}
        <DashboardTour
          subscriberCount={activeWaitlist?.subscriber_count ?? 0}
        />
      </main>
    </div>
  );
}
