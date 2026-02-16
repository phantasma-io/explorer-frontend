"use client";

import { useEffect, useMemo, useRef } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { usePost } from "@/lib/hooks/use-post";
import { useEcho } from "@/lib/i18n/use-echo";
import type { InstructionResults, IntructionParams } from "@/lib/types/api";

interface InstructionsPanelProps {
  script?: string | null;
  loading?: boolean;
  error?: unknown;
}

export function InstructionsPanel({ script, loading, error }: InstructionsPanelProps) {
  const { echo } = useEcho();
  const lastScriptRef = useRef<string | null>(null);

  const { data, error: postError, loading: postLoading, request } = usePost<InstructionResults, IntructionParams>(
    script ? endpoints.instructions() : null,
    script ? { script_raw: script } : undefined,
  );

  useEffect(() => {
    if (!script) return;
    if (lastScriptRef.current === script && data?.instructions?.length) return;
    // Avoid re-posting the same script when tabs are toggled.
    lastScriptRef.current = script;
    void request({ script_raw: script });
  }, [data?.instructions?.length, request, script]);

  const isLoading = loading || postLoading;
  const hasError = Boolean(error || postError || data?.error);

  const instructions = useMemo(() => data?.instructions ?? [], [data?.instructions]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{echo("loading")}</div>;
  }

  if (hasError) {
    return <div className="text-sm text-destructive">{echo("failed_to_load_instructions")}</div>;
  }

  if (!instructions.length) {
    return <div className="text-sm text-muted-foreground">{echo("no-results")}</div>;
  }

  return (
    <div className="grid gap-3">
      {instructions.map((item, index) => {
        const instruction = item.instruction ?? "";
        // Instructions are formatted as `OPCODE:VALUE`, so split once for a clearer label/value layout.
        const [label, ...rest] = instruction.split(":");
        const value = rest.join(":").trim();

        return (
          <div
            key={`${label}-${index}`}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {label || echo("details")}
            </div>
            <div className="mt-1 text-sm text-foreground break-words">
              {value || instruction}
            </div>
          </div>
        );
      })}
    </div>
  );
}
