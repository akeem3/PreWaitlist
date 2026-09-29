"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { SubscriptionCard } from "../../../../../components/billing/subscription-card";
import { PlanComparison } from "../../../../../components/billing/plan-comparison";
import { InvoiceHistory } from "../../../../../components/billing/invoice-history";
import { BillingDetails } from "../../../../../components/billing/billing-details";
import { CancellationFlow } from "../../../../../components/billing/cancellation-flow";
import { DomainAuthSection } from "../../../../../components/billing/domain-auth-section";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";
import { useDashboardTier, useUpgradeModal, useRefreshTier } from "../../shell";

interface ProfileData {
  tier?: string;
  businessAddress?: string;
  scheduledChange?: { action: string; effective_at: string } | null;
  subscriptionStatus?: string | null;
  nextBilledAt?: string | null;
  waitlistCount?: number;
}

function fetchProfile(): Promise<ProfileData | null> {
  return fetch("/api/profile")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

export default function BillingClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const contextTier = useDashboardTier();
  const triggerUpgrade = useUpgradeModal();
  const refreshTier = useRefreshTier();
  const billingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contextTierRef = useRef(contextTier);
  useEffect(() => {
    contextTierRef.current = contextTier;
  }, [contextTier]);

  // Shell context is the source of truth after mount (polling/events update it).
  // Local profile is fallback for initial paint if context is missing.
  const tier = useMemo(() => {
    return contextTier || profile?.tier || "free";
  }, [contextTier, profile?.tier]);
  const isPro = tier === "pro";

  const stopPolling = useCallback(() => {
    if (billingRef.current) {
      clearInterval(billingRef.current);
      billingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    billingRef.current = setInterval(async () => {
      const data = await fetchProfile();
      if (data && data.tier === "pro") {
        stopPolling();
        setProfile(data);
        // Let the shell (and every other dashboard surface) unlock immediately.
        window.dispatchEvent(
          new CustomEvent("tier-changed", { detail: { tier: "pro" } })
        );
      }
    }, 2000);

    setTimeout(stopPolling, 30000);
  }, [stopPolling]);

  useEffect(() => {
    let cancelled = false;
    const syncProfile = async () => {
      const data = await fetchProfile();
      if (cancelled || !data) return;
      setProfile(data);
      // Catch webhook races (e.g. return from Paddle portal before
      // subscription.canceled / activated lands in Postgres).
      if (data.tier && data.tier !== contextTierRef.current) {
        window.dispatchEvent(
          new CustomEvent("tier-changed", { detail: { tier: data.tier } })
        );
      }
    };
    syncProfile();
    const t1 = setTimeout(syncProfile, 2000);
    const t2 = setTimeout(syncProfile, 5000);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // Mount-only: contextTierRef tracks live context without re-running.
  }, []);

  // Shell also listens globally; local polling keeps SubscriptionCard painting
  // in the same tick and dispatches tier-changed for the sidebar/context.
  useEffect(() => {
    const handler = () => startPolling();
    window.addEventListener("paddle-checkout-opened", handler);
    return () => {
      window.removeEventListener("paddle-checkout-opened", handler);
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // ?plan=pro deep link (pay-before-onboarding): auto-open checkout once
  // for free-tier founders. Param always stripped so refresh doesn't reopen
  // (and a stale param can't re-trigger after a downgrade).
  const planOpenedRef = useRef(false);
  useEffect(() => {
    if (planOpenedRef.current) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("plan") !== "pro") return;
      planOpenedRef.current = true;
      params.delete("plan");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "")
      );
      if (contextTierRef.current !== "pro") {
        // Distinct from the settings-page "billing" button: this deep link is
        // explicit Go Pro intent, so it must be exempt from the dismiss
        // cooldown (a prior dismissal would flicker the arrival modal shut).
        triggerUpgrade("pro-cta-billing");
      }
    } catch {}
  }, [triggerUpgrade]);

  const handleAddressSave = useCallback(async (address: string) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_address: address }),
    });
    if (res.ok) {
      setProfile((prev) =>
        prev ? { ...prev, businessAddress: address } : prev
      );
    }
  }, []);

  // 2.3: portal errors surfaced inline per-button (was silent), with pending
  // state disabling the trigger until the portal URL resolves.
  const [portalPending, setPortalPending] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalErrorFor, setPortalErrorFor] = useState<
    "card" | "cancel" | null
  >(null);

  const openPortal = useCallback(async (source: "card" | "cancel") => {
    setPortalPending(true);
    setPortalError(null);
    setPortalErrorFor(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setPortalError(
        typeof data.error === "string" && data.error
          ? data.error
          : "Something went wrong. Please try again."
      );
      setPortalErrorFor(source);
    } catch {
      setPortalError("Something went wrong. Please try again.");
      setPortalErrorFor(source);
    } finally {
      setPortalPending(false);
    }
  }, []);

  const handleManageBilling = useCallback(
    () => openPortal("card"),
    [openPortal]
  );

  // 2.3: return from the Paddle portal with ?canceled=1 → strip param and
  // re-resolve tier so the card repaints (webhook may still be in flight;
  // the mount-sync poll covers the race).
  useEffect(() => {
    if (!refreshTier) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("canceled") !== "1") return;
      params.delete("canceled");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "")
      );
      void refreshTier();
    } catch {}
  }, [refreshTier]);

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <Breadcrumb />
      <div className="mb-8">
        <h1 className="text-h3 font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-body text-muted-foreground">
          Manage your subscription, invoices, and payment method.
        </p>
      </div>

      <div className="space-y-6">
        {!isPro && (profile?.waitlistCount ?? 0) > 1 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-body-sm text-destructive">
              Free includes 1 waitlist — you have {profile?.waitlistCount}.
              Upgrade to Pro to manage them all, or archive the ones you
              don&apos;t need.
            </p>
          </div>
        )}
        <SubscriptionCard
          tier={tier}
          waitlistCount={profile?.waitlistCount ?? 1}
          scheduledChange={profile?.scheduledChange ?? null}
          subscriptionStatus={profile?.subscriptionStatus ?? null}
          nextBilledAt={profile?.nextBilledAt ?? null}
          onManageBilling={isPro ? handleManageBilling : undefined}
          managePending={portalPending}
          portalError={portalErrorFor === "card" ? portalError : null}
        />
        <PlanComparison
          currentTier={tier}
          onUpgradeClick={() => triggerUpgrade("billing")}
        />
        <BillingDetails
          businessAddress={profile?.businessAddress || ""}
          onAddressSave={handleAddressSave}
        />
        <InvoiceHistory isPro={isPro} />
        {isPro && <DomainAuthSection />}
        <CancellationFlow
          isPro={isPro}
          onOpenPortal={() => openPortal("cancel")}
          portalPending={portalPending}
          portalError={portalErrorFor === "cancel" ? portalError : null}
        />
      </div>
    </div>
  );
}
