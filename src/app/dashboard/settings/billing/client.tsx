"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SubscriptionCard } from "../../../../../components/billing/subscription-card";
import { PlanComparison } from "../../../../../components/billing/plan-comparison";
import { InvoiceHistory } from "../../../../../components/billing/invoice-history";
import { BillingDetails } from "../../../../../components/billing/billing-details";
import { CancellationFlow } from "../../../../../components/billing/cancellation-flow";
import { DomainAuthSection } from "../../../../../components/billing/domain-auth-section";
import { Breadcrumb } from "../../../../../components/dashboard/breadcrumb";
import { useUpgradeModal } from "../../shell";

interface ProfileData {
  tier: string;
  businessAddress: string;
}

function fetchProfile(): Promise<ProfileData | null> {
  return fetch("/api/profile")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

export default function BillingClient() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const triggerUpgrade = useUpgradeModal();
  const billingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (billingRef.current) {
      clearInterval(billingRef.current);
      billingRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProfile().then((data) => {
      if (!cancelled && data) setProfile(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    billingRef.current = setInterval(async () => {
      const data = await fetchProfile();
      if (data && data.tier === "pro") {
        stopPolling();
        setProfile(data);
      }
    }, 2000);

    setTimeout(stopPolling, 30000);
  }, [stopPolling]);

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
          tier={profile?.tier || "free"}
          waitlistCount={1}
          onManageBilling={
            profile?.tier === "pro" ? handleManageBilling : undefined
          }
        />
        <PlanComparison
          currentTier={profile?.tier || "free"}
          onUpgradeClick={() => triggerUpgrade("billing")}
        />
        <BillingDetails
          businessAddress={profile?.businessAddress || ""}
          onAddressSave={handleAddressSave}
        />
        <InvoiceHistory isPro={profile?.tier === "pro"} />
        {profile?.tier === "pro" && <DomainAuthSection />}
        <CancellationFlow isPro={profile?.tier === "pro"} />
      </div>
    </div>
  );
}
