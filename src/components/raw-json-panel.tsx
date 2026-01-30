"use client";

import { useCallback, useMemo, useState } from "react";
import {
  JsonView,
  allExpanded,
  collapseAllNested,
} from "react-json-view-lite";
import { useEcho } from "@/lib/i18n/use-echo";
import { CopyButton } from "@/components/copy-button";

interface RawJsonPanelProps {
  data?: unknown;
  emptyLabel?: string;
  rpcUrl?: string | null;
  explorerUrl?: string | null;
}

const jsonViewStyles = {
  container: "json-view",
  childFieldsContainer: "json-view-children",
  basicChildStyle: "json-view-row",
  collapseIcon: "json-view-collapse",
  expandIcon: "json-view-expand",
  collapsedContent: "json-view-collapsed",
  label: "json-view-label",
  clickableLabel: "json-view-label json-view-clickable",
  nullValue: "json-view-null",
  undefinedValue: "json-view-undefined",
  numberValue: "json-view-number",
  stringValue: "json-view-string",
  booleanValue: "json-view-boolean",
  otherValue: "json-view-other",
  punctuation: "json-view-punctuation",
  ariaLables: {
    collapseJson: "Collapse JSON",
    expandJson: "Expand JSON",
  },
  stringifyStringValues: true,
};

export function RawJsonPanel({
  data,
  emptyLabel = "No data.",
  rpcUrl,
  explorerUrl,
}: RawJsonPanelProps) {
  const { echo } = useEcho();
  const [expandMode, setExpandMode] = useState<"collapsed" | "expanded">("collapsed");
  const normalized = useMemo(() => {
    if (!data) return null;
    try {
      // Normalize to a JSON-safe structure so the viewer never crashes on unsupported values.
      return JSON.parse(JSON.stringify(data)) as object | unknown[];
    } catch {
      return null;
    }
  }, [data]);

  const handleExpandAll = useCallback(() => setExpandMode("expanded"), []);
  const handleCollapseAll = useCallback(() => setExpandMode("collapsed"), []);
  const shouldExpandNode = expandMode === "expanded" ? allExpanded : collapseAllNested;
  const copyPayload = useMemo(() => {
    if (!data) return "";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "";
    }
  }, [data]);

  return (
    <div className="glass-panel rounded-2xl p-6 min-w-0">
      {/* Keep raw payload in a bounded code block with scrolling to avoid layout expansion. */}
      <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border/70 bg-card/80 p-4 shadow-inner">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {rpcUrl || explorerUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              {rpcUrl ? (
                <a
                  href={rpcUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border/70 bg-card/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
                >
                  {echo("raw_rpc")}
                </a>
              ) : null}
              {explorerUrl ? (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-border/70 bg-card/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
                >
                  {echo("raw_explorer")}
                </a>
              ) : null}
            </div>
          ) : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <CopyButton value={copyPayload} variant="text" />
            <button
              type="button"
              onClick={handleExpandAll}
              className="rounded-xl border border-border/70 bg-card/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
            >
              {echo("expand_all")}
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="rounded-xl border border-border/70 bg-card/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
            >
              {echo("collapse_all")}
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] w-full max-w-full overflow-auto">
          {normalized ? (
            <JsonView
              key={expandMode}
              data={normalized}
              style={jsonViewStyles}
              shouldExpandNode={shouldExpandNode}
              clickToExpandNode
            />
          ) : (
            <div className="text-xs text-muted-foreground">
              {data ? "Unable to serialize payload." : emptyLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
