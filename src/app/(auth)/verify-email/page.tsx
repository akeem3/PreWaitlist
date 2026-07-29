"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { createClient } from "../../../../src/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    if (!email || cooldown > 0) return;

    setResending(true);
    setResendSuccess(false);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (!error) {
      setResendSuccess(true);
      setCooldown(60);
    }

    setResending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <div className="relative mb-8">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="40"
              cy="40"
              r="36.9861"
              stroke="#0F7A5E"
              strokeWidth="0.747195"
            />
            <rect
              x="20.148"
              y="28.696"
              width="38.184"
              height="31.82"
              stroke="#0F7A5E"
              strokeWidth="0.795496"
            />
            <path
              d="M20.148 35.059L39.24 47.787L58.332 35.059"
              stroke="#0F7A5E"
              strokeWidth="0.795496"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Verify your email
        </h1>

        {email ? (
          <p className="mb-8 text-[#6B6459]">
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            <br />
            Check your inbox and click the link to continue.
          </p>
        ) : (
          <p className="mb-8 text-[#6B6459]">
            We sent a verification link to your email address.
            <br />
            Check your inbox and click the link to continue.
          </p>
        )}

        {resendSuccess && (
          <p className="mb-4 text-sm text-[#0F7A5E]">
            Verification email sent! Check your inbox.
          </p>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full bg-[#0F7A5E] text-white hover:bg-[#0D6A50]"
          onClick={handleResend}
          disabled={cooldown > 0 || resending || !email}
        >
          {resending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend email"}
        </Button>

        <p className="mt-6 text-sm text-[#6B6459]">
          <Link
            href="/signin"
            className="font-medium text-[#0F7A5E] hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4]">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
