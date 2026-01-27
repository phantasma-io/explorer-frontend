"use client";

import { ReactNode, useCallback } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import csvDownload from "json-to-csv-export";
import { ComboSelect } from "@/components/ui/combo-select";

interface OrderOption {
  label: string;
  value: string;
}

interface TableControlsProps {
  tableId: string;
  raw?: unknown[];
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  hasNext: boolean;
  orderBy?: string;
  setOrderBy?: (value: string) => void;
  orderDirection?: "asc" | "desc";
  setOrderDirection?: (value: "asc" | "desc") => void;
  orderByOptions?: OrderOption[];
  exporter?: ReactNode;
}

export function TableControls({
  tableId,
  raw,
  page,
  setPage,
  pageSize: _pageSize,
  setPageSize: _setPageSize,
  hasNext,
  orderBy,
  setOrderBy,
  orderDirection,
  setOrderDirection,
  orderByOptions,
  exporter,
}: TableControlsProps) {
  const handleExport = useCallback(() => {
    const filename = `${tableId}-${new Date().toISOString()}.csv`;
    csvDownload(raw ?? [], filename, ",");
  }, [raw, tableId]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {orderByOptions && setOrderBy ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors">
            Sort
            <ComboSelect
              value={orderBy ?? ""}
              onChange={setOrderBy}
              options={orderByOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              triggerClassName="border-0 bg-transparent px-0 py-0 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-none"
              contentClassName="min-w-[10rem]"
            />
          </div>
        ) : null}
        {setOrderDirection && orderDirection ? (
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors">
            Dir
            <ComboSelect
              value={orderDirection}
              onChange={(value) => setOrderDirection(value as "asc" | "desc")}
              options={[
                { value: "desc", label: "Desc" },
                { value: "asc", label: "Asc" },
              ]}
              triggerClassName="border-0 bg-transparent px-0 py-0 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-none"
              contentClassName="min-w-[8rem]"
            />
          </div>
        ) : null}
        {exporter ?? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          Page {page}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
