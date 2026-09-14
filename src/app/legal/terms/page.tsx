import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-h2 text-foreground">Terms of Service</h1>
      <p className="mb-8 text-caption text-muted-foreground">
        Last updated: September 2026
      </p>

      <div className="space-y-6 text-body text-foreground">
        <section>
          <h2 className="mb-2 text-h4 text-foreground">Acceptance of Terms</h2>
          <p>
            By accessing or using PreWaitlist, you agree to be bound by these
            Terms of Service. If you do not agree to these terms, do not use the
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">
            Description of Service
          </h2>
          <p>
            PreWaitlist provides a waitlist management platform that allows
            founders to create and manage waitlists, collect subscriber emails,
            track referrals, and send email communications. The service is
            provided &quot;as is&quot; without warranties of any kind.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">User Accounts</h2>
          <p>You are responsible for:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Use the service for spam or unsolicited bulk emails</li>
            <li>
              Send emails to people who have not consented to receive them
            </li>
            <li>Use the service for any illegal purpose</li>
            <li>
              Attempt to gain unauthorized access to other accounts or systems
            </li>
            <li>Interfere with or disrupt the service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">
            Intellectual Property
          </h2>
          <p>
            You retain ownership of all content you create using PreWaitlist,
            including waitlist pages, email content, and subscriber data.
            PreWaitlist owns the platform, software, and all intellectual
            property rights in the service itself.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Privacy</h2>
          <p>
            Your use of the service is also governed by our{" "}
            <Link href="/legal/privacy" className="text-accent underline">
              Privacy Policy
            </Link>
            , which is incorporated into these terms by reference.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">
            Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, PreWaitlist shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits or revenues, whether
            incurred directly or indirectly, or any loss of data, use, goodwill,
            or other intangible losses resulting from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless PreWaitlist and its
            officers, directors, employees, and agents from any claims, losses,
            or damages, including legal fees, arising from your use of the
            service or violation of these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Termination</h2>
          <p>
            We may suspend or terminate your access to the service at any time,
            with or without cause, with or without notice. Upon termination,
            your right to use the service ceases immediately. You may also
            terminate your account at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Governing Law</h2>
          <p>
            These terms shall be governed by the laws of the State of
            California, United States, without regard to its conflict of law
            provisions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will
            notify you of any material changes by posting the new terms on this
            page and updating the &quot;Last updated&quot; date.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-h4 text-foreground">Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
            <a
              href="mailto:legal@prewaitlist.com"
              className="text-accent underline"
            >
              legal@prewaitlist.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-8 border-t border-border pt-4">
        <Link href="/" className="text-body-sm text-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
