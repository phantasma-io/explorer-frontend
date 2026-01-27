"use client";

import { useMemo } from "react";

interface MetadataBlockProps {
  title: string;
  metadata?: Record<string, unknown>;
}

export function MetadataBlock({ title, metadata }: MetadataBlockProps) {
  const entries = useMemo(() => {
    if (!metadata) return [];
    // Filter empty values so metadata cards only show meaningful fields.
    return Object.entries(metadata).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim() !== "";
      return true;
    });
  }, [metadata]);

  if (!entries.length) return null;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {title}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-xl border border-border/70 bg-card/85 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {key}
            </div>
            <div className="mt-1 text-sm text-foreground break-words">
              {typeof value === "string" ? value : JSON.stringify(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
