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
import { useRouter, useSearchParams } from "next/navigation";
import { STORAGE_KEY } from "../../../components/dashboard/waitlist-switcher";

interface WaitlistRow {
  id: string;
  subdomain: string;
  product_name: string | null;
  logo_url: string | null;
  is_archived: boolean;
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
}

function getServerDefaultId(waitlists: WaitlistRow[]): string {
  return waitlists[waitlists.length - 1].id;
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
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    triggerSource: string;
  }>({ open: false, triggerSource: "" });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeWaitlistId, setActiveWaitlistId] = useState(() =>
    getServerDefaultId(waitlists)
  );
  const [tier, setTierState] = useState(serverTier);
  const tierRef = useRef(serverTier);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTier = useCallback((next: string) => {
    if (tierRef.current === next) return;
    tierRef.current = next;
    setTierState(next);
  }, []);

  // Accept server-prop updates (router.refresh / navigation). Client-applied
  // values already match the DB when we set them, so this is a no-op in the
  // common case and catches external refreshes (e.g. overview visibility).
  useEffect(() => {
    if (serverTier !== tierRef.current) {
      tierRef.current = serverTier;
      setTierState(serverTier);
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
  // corrects to the stored preference.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const wid = searchParams.get("wid");
    if (wid && waitlists.some((w) => w.id === wid)) {
      setActiveWaitlistId(wid);
      return;
    }
    const stored = getStoredId(waitlists);
    if (stored) {
      setActiveWaitlistId(stored);
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

  const effectiveId = activeWaitlistId;

  const activeWaitlist = waitlists.find((w) => w.id === effectiveId);

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

  async function handleUnarchive() {
    if (!effectiveId) return;
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waitlist_id: effectiveId,
          is_archived: false,
          archived_at: null,
        }),
      });
      router.refresh();
    } catch {
      // silent
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

      <main className="min-h-screen lg:ml-67">
        <DashboardContext.Provider value={contextValue}>
          {children}
        </DashboardContext.Provider>
      </main>
    </div>
  );
}
