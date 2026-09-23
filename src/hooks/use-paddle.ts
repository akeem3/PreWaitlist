"use client";

import { useEffect, useRef, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";

export function usePaddle() {
  const paddleRef = useRef<Paddle | null>(null);
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  useEffect(() => {
    if (paddleRef.current) return;

    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENV as
      "sandbox" | "production" | undefined;

    if (!token) {
      console.error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set");
      return;
    }

    initializePaddle({
      token,
      environment,
      eventCallback: (event) => {
        if (
          event.name === "checkout.error" ||
          event.name === "checkout.payment.error" ||
          event.name === "checkout.failed"
        ) {
          console.error("Paddle checkout event", event.name, {
            type: event.type,
            code: event.code,
            detail: event.detail,
            documentation_url: event.documentation_url,
          });
          return;
        }

        if (
          event.name === "checkout.completed" ||
          event.name === "checkout.closed"
        ) {
          console.info("Paddle checkout event", event.name, {
            transactionId: event.data?.transaction_id,
            status: event.data?.status,
            customData: event.data?.custom_data,
          });
        }
      },
    }).then((instance) => {
      if (instance) {
        paddleRef.current = instance;
        setPaddle(instance);
      }
    });
  }, []);

  return paddle;
}
