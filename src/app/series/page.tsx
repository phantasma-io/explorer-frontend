"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Series, SeriesResults } from "@/lib/types/api";
import { numberFormat, stringTruncateMiddle } from "@/lib/utils/format";
import { buildSeriesSupplyMetrics } from "@/lib/utils/series-supply";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { useEcho } from "@/lib/i18n/use-echo";

export default function SeriesPage() {
  const { echo } = useEcho();
  const table = useTable();
  const effectiveOrderBy = table.orderBy === "id" ? "created" : table.orderBy;
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);

  const { data, loading, error } = useApi<SeriesResults>(
    endpoints.series({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: effectiveOrderBy,
      order_direction: table.orderDirection,
      q,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.series?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.series?.length]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQ(trimmed || undefined);
    table.resetPagination();
  };

  const columns = useMemo<Column<Series>[]>(() => {
    return [
      {
        id: "image",
        label: echo("image"),
        render: (row) =>
          row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.image}
              alt={row.name ?? "Series"}
              className="h-10 w-10 rounded-xl border border-border/60 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              SER
            </div>
          ),
      },
      {
        id: "name",
        label: echo("name"),
        render: (row) => (
          <div className="min-w-0">
            <Link href={`/series/${row.id}`} className="break-all text-sm font-semibold link">
              {row.name ?? row.id}
            </Link>
            {row.description ? (
              <div className="break-words text-xs text-muted-foreground">{row.description}</div>
            ) : null}
            <div className="mt-1 text-[11px] text-muted-foreground">
              {row.series_id ? (
                <span title={`#${row.series_id}`}>
                  #{stringTruncateMiddle(row.series_id, 14, 10)}
                </span>
              ) : (
                "—"
              )}
              {row.symbol ? (
                <>
                  {" · "}
                  <Link href={`/token/${row.symbol}`} className="link">
                    {row.symbol}
                  </Link>
                </>
              ) : null}
              {row.chain ? ` · ${row.chain}` : ""}
            </div>
          </div>
        ),
      },
      {
        id: "creator",
        label: echo("creator"),
        render: (row) =>
          row.creator ? (
            <Link href={`/address/${row.creator}`} className="link">
              {stringTruncateMiddle(row.creator, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "created_at",
        label: echo("created_at"),
        render: (row) =>
          row.created_unix_seconds
            ? formatDateTime(unixToDate(row.created_unix_seconds))
            : "—",
      },
      {
        id: "contract",
        label: echo("contract"),
        render: (row) =>
          row.contract ? (
            <Link href={`/contract/${row.contract}`} className="link">
              {stringTruncateMiddle(row.contract, 10, 8)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "supply",
        label: echo("supply_progress"),
        render: (row) => {
          const metrics = buildSeriesSupplyMetrics(
            row.current_supply,
            row.max_supply,
          );
          const currentLabel =
            metrics.current !== null ? numberFormat(metrics.current, "0,0") : "—";
          const maxLabel =
            metrics.max !== null ? numberFormat(metrics.max, "0,0") : "—";
          const percentLabel =
            metrics.percent !== null
              ? `${numberFormat(metrics.percent, "0,0.[00]")}%`
              : "—";
          const remainingLabel =
            metrics.remaining !== null
              ? numberFormat(metrics.remaining, "0,0")
              : "—";

          return (
            <div className="min-w-[14rem] space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold text-foreground">
                  {currentLabel} / {maxLabel}
                </span>
                <span className="text-xs text-muted-foreground">{percentLabel}</span>
              </div>
              <div className="h-2 rounded-full bg-muted/70">
                <div
                  className="h-full rounded-full bg-emerald-500/80 transition-[width]"
                  style={{ width: `${metrics.percent ?? 0}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {echo("remaining_supply")}: {remainingLabel}
              </div>
            </div>
          );
        },
      },
      {
        id: "royalties",
        label: echo("royalties"),
        render: (row) => row.royalties ?? "—",
      },
    ];
  }, [echo]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("series")}</h1>
            <div className="w-full max-w-sm">
              <ListSearch
                value={search}
                onChange={setSearch}
                onSubmit={applySearch}
                placeholder={echo("search")}
              />
            </div>
          </div>
        </div>

        <DataTable
          tableId="PhantasmaExplorer-Series"
          columns={columns}
          rows={data?.series ?? []}
          raw={data?.series ?? []}
          loading={loading}
          error={Boolean(error || data?.error)}
          controls={{
            page: table.page,
            setPage: table.setPage,
            pageSize: table.pageSize,
            setPageSize: table.setPageSize,
            hasNext: table.hasNext,
            orderBy: effectiveOrderBy,
            setOrderBy: table.setOrderBy,
            orderDirection: table.orderDirection,
            setOrderDirection: table.setOrderDirection,
            orderByOptions: [
              { label: "Creation order", value: "created" },
              { label: "Name", value: "name" },
            ],
          }}
        />
      </div>
    </AppShell>
  );
}
