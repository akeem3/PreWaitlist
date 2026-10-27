import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function UnsubscribeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
