import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export const panelChrome =
  "rounded-[var(--card-radius)] border border-border bg-card p-5";

interface PanelHeaderProps {
  title: ReactNode;
  action?: ReactNode;
}

export function PanelHeader({ title, action }: PanelHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="min-w-0 truncate text-h4 text-foreground">{title}</h3>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

interface PanelProps {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Panel({
  title,
  action,
  className,
  children,
}: PanelProps) {
  return (
    <div className={cn(panelChrome, className)}>
      {title != null && <PanelHeader title={title} action={action} />}
      {children}
    </div>
  );
}
