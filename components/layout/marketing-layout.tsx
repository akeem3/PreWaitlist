"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-normal"
      {...(isHome ? { "data-transparent": "" } : {})}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/main-logo.svg"
            alt="MyWaitlist"
            width={132}
            height={45}
            priority
          />
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <Link
            href="/signin"
            className="text-body-sm font-medium text-muted-foreground transition-colors duration-normal hover:text-accent"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-[var(--button-radius)] bg-accent px-4 text-body-sm text-accent-foreground transition-colors duration-normal hover:bg-accent-hover"
          >
            Build it free
          </Link>
        </nav>

        <button
          type="button"
          className="flex items-center justify-center md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 12H21M3 6H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 md:hidden" style={{ zIndex: 30 }}>
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute right-0 top-0 flex h-full w-72 flex-col bg-background p-6"
            style={{ zIndex: 40, boxShadow: "var(--shadow-float)" }}
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="flex items-center">
                <Image
                  src="/main-logo.svg"
                  alt="MyWaitlist"
                  width={132}
                  height={45}
                />
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              <Link
                href="/signin"
                onClick={() => setMenuOpen(false)}
                className="text-body font-medium text-foreground transition-colors duration-normal hover:text-accent"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-[var(--button-radius)] bg-accent px-4 text-body text-accent-foreground transition-colors duration-normal hover:bg-accent-hover"
              >
                Build it free
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#CCC9C3] bg-muted">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 text-caption text-muted-foreground">
        <p className="flex items-center gap-2">
          <Image
            src="/MyWaitlist Offical logo.png"
            alt=""
            width={36}
            height={27}
          />
          © {new Date().getFullYear()} MyWaitlist. All rights reserved.
        </p>
        <p>Powered by MyWaitlist</p>
        <nav className="flex gap-4">
          <a
            href="#"
            className="transition-colors duration-normal hover:text-foreground"
          >
            Terms
          </a>
          <a
            href="#"
            className="transition-colors duration-normal hover:text-foreground"
          >
            Privacy
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
