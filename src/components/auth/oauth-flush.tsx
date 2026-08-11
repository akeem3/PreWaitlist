"use client";

import { useEffect, useRef } from "react";
import { useOnboardingForm } from "../../app/onboarding/context";
import { createClient } from "../../lib/supabase/client";

export function OAuthFlush() {
  const form = useOnboardingForm();
  const supabase = createClient();

  const flushToAPIRef = useRef(form.flushToAPI);

  useEffect(() => {
    flushToAPIRef.current = form.flushToAPI;
  }, [form.flushToAPI]);

  useEffect(() => {
    let cancelled = false;

    async function flush() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Use the context's flushToAPI which reads from in-memory state
      await flushToAPIRef.current();
    }

    flush();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
