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

    initializePaddle({ token, environment }).then((instance) => {
      if (instance) {
        paddleRef.current = instance;
        setPaddle(instance);
      }
    });
  }, []);

  return paddle;
}
