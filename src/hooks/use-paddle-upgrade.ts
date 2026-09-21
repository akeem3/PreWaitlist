"use client";

import { useCallback, useRef, useEffect } from "react";
import { usePaddle } from "./use-paddle";

interface UsePaddleUpgradeOptions {
  onTierChanged?: (tier: string) => void;
  triggerSource: string;
}

export function usePaddleUpgrade({
  onTierChanged,
  triggerSource,
}: UsePaddleUpgradeOptions) {
  const paddle = usePaddle();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const startPolling = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 30; // 30 × 2s = 60s max

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts >= maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        return;
      }

      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.tier === "pro") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            pollingRef.current = null;
            onTierChanged?.("pro");
          }
        }
      } catch {
        // Silent — keep polling
      }
    }, 2000);
  }, [onTierChanged]);

  const openCheckout = useCallback(async () => {
    if (!paddle) return;

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerSource }),
      });
      const data = await res.json();
      if (data.priceId) {
        paddle.Checkout.open({
          items: [{ priceId: data.priceId, quantity: 1 }],
          customData: data.customData,
          settings: { variant: "one-page" },
        });
        // Start polling for tier change after checkout opens
        startPolling();
      }
    } catch {
      // Silent
    }
  }, [paddle, triggerSource, startPolling]);

  const cancel = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  return { openCheckout, cancel, isReady: !!paddle };
}
