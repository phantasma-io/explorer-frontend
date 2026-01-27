"use client";

import { useMemo } from "react";

interface ScriptPanelProps {
  script?: string | null;
  emptyLabel?: string;
}

export function ScriptPanel({ script, emptyLabel = "No script available." }: ScriptPanelProps) {
  const content = useMemo(() => script?.trim() || emptyLabel, [script, emptyLabel]);

  return (
    <div className="glass-panel rounded-2xl p-6">
      {/* Preserve VM script formatting for readability and copy/paste. */}
      <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
        {content}
      </pre>
    </div>
  );
}
