"use client";

import { useMemo } from "react";

interface RawJsonPanelProps {
  data?: unknown;
  emptyLabel?: string;
}

export function RawJsonPanel({ data, emptyLabel = "No data." }: RawJsonPanelProps) {
  const content = useMemo(() => {
    if (!data) return emptyLabel;
    try {
      // JSON stringify can throw on circular structures; guard to keep UI stable.
      return JSON.stringify(data, null, 2);
    } catch {
      return "Unable to serialize payload.";
    }
  }, [data, emptyLabel]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
        {content}
      </pre>
    </div>
  );
}
