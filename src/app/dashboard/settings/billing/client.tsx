"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { SubscriptionCard } from "../../../../../components/billing/subscription-card";
import { PlanComparison } from "../../../../../components/billing/plan-comparison";
import { InvoiceHistory } from "../../../../../components/billing/invoice-history";
import { BillingDetails } from "../../../../../components/billing/billing-details";
import { CancellationFlow } from "../../../../../components/billing/cancellation-flow";
import { DomainAuthSection } from "../../../../../components/billing/domain-auth-section";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";
import { useDashboardTier, useUpgradeModal } from "../../shell";

interface ProfileData {
  tier?: string;
  businessAddress?: string;
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

  const handleManageBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silent
    }
  }, []);

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
        <SubscriptionCard
          tier={tier}
          waitlistCount={1}
          onManageBilling={isPro ? handleManageBilling : undefined}
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
        <CancellationFlow isPro={isPro} />
      </div>
    </div>
  );
}
