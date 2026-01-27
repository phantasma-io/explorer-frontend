"use client";

import { useMemo } from "react";

interface MetadataPanelProps {
  title: string;
  data?: Record<string, string | number | null | undefined>;
}

export function MetadataPanel({ title, data }: MetadataPanelProps) {
  const entries = useMemo(
    () =>
      Object.entries(data ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== ""),
    [data],
  );

  if (!entries.length) return null;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm"
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {key}
            </div>
            <div className="mt-1 text-foreground">{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
