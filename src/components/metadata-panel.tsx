"use client";

import { useMemo } from "react";
import { VmValueView } from "@/components/vm-value-view";
import type { VmValue } from "@/lib/types/api";
import { stringTruncate } from "@/lib/utils/format";

interface MetadataPanelProps {
  title: string;
  data?: Record<string, VmValue | number | null | undefined>;
  maxValueLength?: number;
  singleLineMaxLength?: number;
}

export function MetadataPanel({
  title,
  data,
  maxValueLength,
  singleLineMaxLength,
}: MetadataPanelProps) {
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
        {entries.map(([key, value]) => {
          // Values keep their VM shape: an array or a struct is rendered structurally,
          // because truncating a serialized document would show the reader nothing but
          // its opening brace. Scalars keep the length handling this panel exists for.
          if (value !== null && typeof value === "object") {
            return (
              <div
                key={key}
                className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {key}
                </div>
                <div className="mt-1 text-foreground">
                  <VmValueView value={value} />
                </div>
              </div>
            );
          }

          const raw = String(value);
          const hasWhitespace = /\s/.test(raw);
          const hardLimit = maxValueLength ?? raw.length;
          const longestTokenLength = raw
            .split(/\s+/)
            .reduce((max, token) => Math.max(max, token.length), 0);
          const hasLongToken =
            Boolean(singleLineMaxLength) && longestTokenLength > (singleLineMaxLength ?? 0);
          const effectiveLimit =
            (!hasWhitespace || hasLongToken) && singleLineMaxLength
              ? Math.min(hardLimit, singleLineMaxLength)
              : hardLimit;
          const shouldTrim = raw.length > effectiveLimit;
          const display = shouldTrim ? stringTruncate(raw, effectiveLimit) : raw;

          return (
            <div
              key={key}
              className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {key}
              </div>
              <div
                className="mt-1 text-foreground"
                title={shouldTrim ? raw : undefined}
              >
                {display}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
