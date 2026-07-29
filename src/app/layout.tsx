import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MarketingLayout from "../../components/layout/marketing-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wait App",
  description: "Pre-launch waitlist SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MarketingLayout>{children}</MarketingLayout>
      </body>
    </html>
  );
}
