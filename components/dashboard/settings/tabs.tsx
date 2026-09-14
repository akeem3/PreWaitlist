"use client";

import { cn } from "../../lib/cn";

interface Tab {
  id: string;
  label: string;
}

interface SettingsTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function SettingsTabs({
  tabs,
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="mb-6 overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm font-medium transition-colors",
              "border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
