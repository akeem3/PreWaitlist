import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <h1 className="mb-4 text-2xl font-semibold text-foreground">
          Authentication error
        </h1>

        <p className="mb-8 text-muted-foreground">
          This link is invalid, expired, or has already been used. If you just
          confirmed your email, sign in to continue — otherwise, request a new
          link.
        </p>

        <Link
          href="/signin"
          className="inline-flex h-12 items-center justify-center rounded-[10.6266px] bg-accent px-6 text-base font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
