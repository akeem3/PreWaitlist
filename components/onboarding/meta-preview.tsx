interface MetaPreviewProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  slug: string;
}

export default function MetaPreview({
  headline,
  subheadline,
  ctaText,
  slug,
}: MetaPreviewProps) {
  const liveUrl = slug
    ? `${slug}.prewaitlist.com`
    : "your-slug.prewaitlist.com";

  return (
    <div className="rounded-(--radius-lg) border border-border bg-card overflow-hidden">
      <div className="flex h-8 items-center gap-1.5 border-b border-border px-3">
        <span className="block h-2 w-2 rounded-full bg-dot-inactive" />
        <span className="block h-2 w-2 rounded-full bg-dot-inactive" />
        <span className="block h-2 w-2 rounded-full bg-dot-inactive" />
      </div>
      <div className="flex flex-col items-center p-4 text-center">
        <p className="text-sm font-bold text-foreground leading-tight">
          {headline || "Your Headline"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
          {subheadline || "Your subheadline goes here"}
        </p>
        <div className="mt-3 flex w-full max-w-[260px] items-center gap-2">
          <div className="h-7 flex-1 shrink-0 rounded border border-border bg-background px-2">
            <span className="text-[10px] leading-7 text-muted-foreground">
              Enter your email
            </span>
          </div>
          <div className="h-7 shrink-0 rounded bg-accent px-3">
            <span className="text-[10px] leading-7 font-medium text-white whitespace-nowrap">
              {ctaText || "Join Waitlist"}
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-2.5 text-center">
        <p className="text-[10px] text-muted-foreground">{liveUrl}</p>
        <p className="mt-0.5 text-xs font-bold text-foreground leading-tight">
          {headline || "Your Headline"} — Join the waitlist
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug">
          {subheadline || "Your subheadline goes here"}
        </p>
      </div>
    </div>
  );
}
