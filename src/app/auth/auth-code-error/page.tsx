import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4">
      <div className="flex w-full max-w-[420px] flex-col items-center text-center">
        <h1 className="mb-4 text-2xl font-semibold text-foreground">
          Authentication error
        </h1>

        <p className="mb-8 text-[#6B6459]">
          Something went wrong during authentication. The link may have expired
          or been used already.
        </p>

        <Link
          href="/signin"
          className="inline-flex h-12 items-center justify-center rounded-[10.6266px] bg-[#0F7A5E] px-6 text-base font-medium text-white transition-colors hover:bg-[#0D6A50]"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
