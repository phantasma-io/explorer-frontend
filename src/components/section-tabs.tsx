"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

export interface SectionTab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  actions?: ReactNode;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  defaultTabId?: string;
  queryKey?: string;
  header?: ReactNode;
}

const DEFAULT_QUERY_KEY = "tab";

export function SectionTabs({ tabs, defaultTabId, queryKey = DEFAULT_QUERY_KEY, header }: SectionTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultId = useMemo(() => {
    if (defaultTabId && tabs.some((tab) => tab.id === defaultTabId)) {
      return defaultTabId;
    }
    return tabs[0]?.id;
  }, [defaultTabId, tabs]);

  const queryValue = searchParams?.get(queryKey) ?? "";
  const queryTab = useMemo(
    () => (tabs.some((tab) => tab.id === queryValue) ? queryValue : ""),
    [queryValue, tabs],
  );

  const [activeId, setActiveId] = useState<string | undefined>(queryTab || defaultId);

  useEffect(() => {
    if (queryTab) {
      setActiveId(queryTab);
      return;
    }
    if (defaultId) {
      setActiveId(defaultId);
    }
  }, [defaultId, queryTab]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeId) ?? tabs[0],
    [activeId, tabs],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setActiveId(id);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set(queryKey, id);
      // Sync the tab in the URL so the view is shareable and survives reloads.
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [queryKey, router, searchParams],
  );

  if (!activeTab) return null;

  const tabButtons = (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/70 p-2 sm:flex-nowrap sm:overflow-x-auto sm:no-scrollbar"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeTab.id}
          aria-controls={`tab-panel-${tab.id}`}
          disabled={tab.disabled}
          onClick={() => handleSelect(tab.id)}
          className={clsx(
            "rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            tab.id === activeTab.id
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            tab.disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="grid gap-6">
      {header ? (
        <div className="glass-panel rounded-3xl p-6">
          {header}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            {tabButtons}
            {activeTab.actions ? (
              <div className="flex flex-wrap items-center justify-end gap-3">{activeTab.actions}</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          {tabButtons}
          {activeTab.actions ? (
            <div className="flex flex-wrap items-center justify-end gap-3">{activeTab.actions}</div>
          ) : null}
        </div>
      )}
      <div id={`tab-panel-${activeTab.id}`} role="tabpanel">
        {activeTab.content}
      </div>
    </div>
  );
}
