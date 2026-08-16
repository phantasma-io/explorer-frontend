"use client";

import { useMemo } from "react";
import { useEcho } from "@/lib/i18n/use-echo";

interface ScriptPanelProps {
  script?: string | null;
  emptyLabel?: string;
}

export function ScriptPanel({ script, emptyLabel }: ScriptPanelProps) {
  const { echo } = useEcho();
  const content = useMemo(
    () => script?.trim() || emptyLabel || echo("no_script"),
    [echo, script, emptyLabel],
  );

  return (
    <div className="glass-panel rounded-2xl p-6">
      {/* Preserve VM script formatting for readability and copy/paste. */}
      <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
        {content}
      </pre>
    </div>
  );
}
