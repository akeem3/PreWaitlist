"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const sectionLinks = [
  { label: "Problem", id: "problem" },
  { label: "Difference", id: "difference" },
  { label: "Comparison", id: "comparison" },
  { label: "Features", id: "features" },
  { label: "Confidence", id: "confidence" },
  { label: "Pricing", id: "pricing" },
];

function useSmoothScroll() {
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const isTopOrBottom = id === "hero" || id === "pricing";
      el.scrollIntoView({
        behavior: "smooth",
        block: isTopOrBottom ? "start" : "center",
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { scrollTo, scrollToTop };
}

function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollTo, scrollToTop } = useSmoothScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    scrollTo(id);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      scrollToTop();
    }
  };

  return (
    <header
      className={`sticky top-0 z-(--z-sticky) bg-background/80 backdrop-blur-md transition-colors duration-normal ${
        scrolled ? "" : "border-b border-border"
      }`}
      {...(isHome ? { "data-transparent": "" } : {})}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center" onClick={handleLogoClick}>
          <Image
            src="/PreWaitlist-logo.svg"
            alt="PreWaitlist"
            width={132}
            height={45}
            priority
          />
        </Link>

        {isHome && (
          <nav className="hidden items-center gap-6 md:flex">
            {sectionLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="text-body-sm font-medium text-muted-foreground transition-colors duration-normal hover:text-accent"
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        <nav className="hidden items-center gap-4 md:flex">
          <Link
            href="/onboarding/1"
            className="inline-flex h-9 items-center rounded-(--button-radius) bg-accent px-3.5 text-body-sm text-accent-foreground transition-colors duration-normal hover:bg-accent-hover"
          >
            Build it free
          </Link>
        </nav>

        <nav className="flex items-center gap-3 md:hidden">
          <Link
            href="/onboarding/1"
            className="inline-flex h-9 items-center rounded-(--button-radius) bg-accent px-3.5 text-body-sm text-accent-foreground transition-colors duration-normal hover:bg-accent-hover"
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

      {menuOpen &&
        createPortal(
          <div className="fixed inset-0 md:hidden" style={{ zIndex: 9999 }}>
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-0 flex w-72 flex-col rounded-bl-2xl bg-background p-6 shadow-[var(--shadow-float)]">
              <div className="mb-8 flex items-center justify-end">
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
              <nav className="flex flex-col">
                <Link
                  href="/signin"
                  onClick={() => setMenuOpen(false)}
                  className="text-body font-medium text-accent transition-colors duration-normal hover:text-accent-hover border-b border-border pb-4 mb-4"
                >
                  Sign in
                </Link>
                {isHome &&
                  sectionLinks.map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => handleNavClick(link.id)}
                      className="text-left text-body font-medium text-foreground transition-colors duration-normal hover:text-accent py-2"
                    >
                      {link.label}
                    </button>
                  ))}
                <Link
                  href="/onboarding/1"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-(--button-radius) bg-accent px-4 text-body text-accent-foreground transition-colors duration-normal hover:bg-accent-hover"
                >
                  Build it free
                </Link>
              </nav>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#CCC9C3]">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 text-body text-muted-foreground">
        <p className="flex items-center gap-1">
          <Image src="/just-logo.png" alt="" width={48} height={36} />
          &copy; {new Date().getFullYear()} PreWaitlist
        </p>
        <nav className="flex gap-4">
          <Link
            href="/legal/privacy"
            className="transition-colors duration-normal hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/legal/terms"
            className="transition-colors duration-normal hover:text-foreground"
          >
            Terms
          </Link>
          <a
            href="https://twitter.com/prewaitlist"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-normal hover:text-foreground"
          >
            Twitter
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
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
