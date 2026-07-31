import { cn } from "../lib/cn";

interface StickyCTAProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyCTA({ children, className }: StickyCTAProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 bg-background px-14 pb-14 pt-4 md:static md:px-0 md:pb-0 md:pt-0",
        className
      )}
    >
      {children}
    </div>
  );
}
