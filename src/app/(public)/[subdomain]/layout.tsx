import type { Metadata } from "next";

type Props = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  // og:image from the file convention must resolve against this page's own
  // origin: the www host's updateSession 307s anonymous crawlers to /signin,
  // handing them HTML instead of the PNG. The subdomain host takes the proxy
  // rewrite branch and never runs updateSession.
  return {
    metadataBase: new URL(`https://${subdomain}.prewaitlist.com`),
  };
}

export default function SubdomainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
