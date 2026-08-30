import { cn } from "../lib/cn";

interface ReferralLinkProps {
  url: string;
  className?: string;
}

export function ReferralLink({ url, className }: ReferralLinkProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-border bg-card px-4 py-3",
        className
      )}
    >
      <input
        type="text"
        value={url}
        readOnly
        aria-label="Referral link"
        className="w-full bg-transparent text-body-sm text-foreground outline-none"
      />
    </div>
  );
}
