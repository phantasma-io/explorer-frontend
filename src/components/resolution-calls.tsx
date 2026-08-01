"use client";

import { useMemo, useState } from "react";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { VmValueView } from "@/components/vm-value-view";
import type { ResolutionCall, ResolutionCallResults } from "@/lib/types/api";
import { useEcho } from "@/lib/i18n/use-echo";

interface ResolutionCallsProps {
  eventId: number;
  /** Total call count reported by the event response, before this list is paged. */
  total: number;
}

const PAGE_SIZE = 25;

const callLabel = (call: ResolutionCall) => {
  const moduleName = call.module ?? (call.module_id !== undefined ? `${call.module_id}` : "");
  const method = call.method ?? (call.method_id !== undefined ? `${call.method_id}` : "");
  if (moduleName && method) return `${moduleName}.${method}`;
  return moduleName || method || "—";
};

/**
 * The calls a special resolution executed, with their decoded arguments.
 *
 * The arguments are not part of the event response on purpose: a single repair resolution
 * holds tens of megabytes of them, and shipping that with every event listing was the
 * whole cost of these payloads. They are fetched a page at a time from the resolution-call
 * endpoint, and only for the resolution the reader actually opened.
 */
export function ResolutionCalls({ eventId, total }: ResolutionCallsProps) {
  const { echo } = useEcho();
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  const endpoint = useMemo(
    () =>
      endpoints.resolutionCalls(eventId, {
        limit: PAGE_SIZE,
        cursor: page > 0 ? `offset:${page * PAGE_SIZE}` : undefined,
      }),
    [eventId, page],
  );
  const { data, loading, error } = useApi<ResolutionCallResults>(endpoint);

  const calls = data?.calls ?? [];
  const totalResults = data?.total_results ?? total;
  const lastPage = Math.max(0, Math.ceil(totalResults / PAGE_SIZE) - 1);

  if (!total) return null;

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          {echo("resolution-calls")}
        </div>
        <div className="text-xs text-muted-foreground">{totalResults}</div>
      </div>

      {loading && <div className="mt-4 text-sm text-muted-foreground">{echo("loading")}</div>}
      {error && <div className="mt-4 text-sm text-destructive">{echo("failed_to_load_data")}</div>}

      <div className="mt-4 grid gap-2">
        {calls.map((call, index) => {
          const position = page * PAGE_SIZE + index;
          const isOpen = expanded === position;
          const nested = call.calls?.length ?? 0;
          return (
            <div key={position} className="rounded-xl border border-border/70 bg-card/85">
              <button
                type="button"
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpanded(isOpen ? null : position)}
              >
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {position + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{callLabel(call)}</span>
                {nested > 0 ? (
                  <span className="text-xs text-muted-foreground">+{nested}</span>
                ) : null}
                {call.arguments ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {isOpen ? "−" : "+"}
                  </span>
                ) : null}
              </button>
              {isOpen && call.arguments ? (
                <div className="border-t border-border/70 px-4 py-3 text-sm">
                  <VmValueView value={call.arguments as never} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {lastPage > 0 ? (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || loading}
          >
            {echo("table-prevpage")}
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {lastPage + 1}
          </span>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40"
            onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
            disabled={page >= lastPage || loading}
          >
            {echo("table-nextpage")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
