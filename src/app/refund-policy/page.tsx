import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-h2 text-foreground">
        Refund and Cancellation Policy
      </h1>

      <div className="space-y-6 text-body text-foreground">
        <p>
          PreWaitlist Pro is offered for <strong>$15 per month</strong> on the
          public pricing page. Purchases are processed through Paddle.
          Paddle&apos;s Buyer Terms describe Paddle as the authorized reseller
          for purchases made through Paddle Checkout, and its Buyer Refund
          Policy governs transaction refund requests.
        </p>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">
            Subscriptions and cancellations
          </h2>
          <p>
            Subscriptions renew automatically for successive billing periods
            until canceled. Customers can manage or cancel a subscription
            through the Paddle customer portal linked from their transaction
            confirmation email or the PreWaitlist billing area. Under
            Paddle&apos;s Buyer Terms, cancellation takes effect at the end of
            the current billing period and prevents later renewals. Access to
            paid features is expected to continue through that period,
            consistent with the current PreWaitlist cancellation flow.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Refunds</h2>
          <p>
            Refund requests for Paddle transactions should be submitted through
            Paddle&apos;s buyer support site at{" "}
            <a
              href="https://paddle.net/"
              className="text-accent underline"
              rel="noopener noreferrer"
            >
              Paddle.net
            </a>{" "}
            or through the support link in the customer&apos;s receipt or
            billing area. Refund eligibility is governed by Paddle&apos;s{" "}
            <a
              href="https://www.paddle.com/legal/refund-policy"
              className="text-accent underline"
              rel="noopener noreferrer"
            >
              Buyer Refund Policy
            </a>
            , the{" "}
            <a
              href="https://www.paddle.com/legal/buyer-terms"
              className="text-accent underline"
              rel="noopener noreferrer"
            >
              Paddle Buyer Terms
            </a>
            , and any non-waivable rights under applicable law. Paddle&apos;s
            published policy states that transactions are generally
            non-refundable unless required by law, while also preserving
            statutory rights and allowing discretionary refunds.
          </p>
        </section>

        <p>
          For help accessing PreWaitlist or reporting a product issue, contact{" "}
          <a
            href="mailto:boundlessfc9@gmail.com"
            className="text-accent underline"
          >
            boundlessfc9@gmail.com
          </a>
          . Contacting PreWaitlist does not replace any refund or withdrawal
          request that must be submitted to Paddle.
        </p>
      </div>

      <div className="mt-8 border-t border-border pt-4">
        <Link href="/" className="text-body-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
