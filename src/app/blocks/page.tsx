"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Block } from "@/lib/types/api";
import type { BlockResults } from "@/lib/types/api";
import { formatDateTime, formatRelativeAge, unixToDate } from "@/lib/utils/time";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

export default function BlocksPage() {
  const { echo } = useEcho();
  const table = useTable();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);

  const { data, loading, error } = useApi<BlockResults>(
    endpoints.blocks({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: table.orderBy,
      order_direction: table.orderDirection,
      q,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.blocks?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.blocks?.length]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQ(trimmed || undefined);
    table.resetPagination();
  };

  const columns = useMemo<Column<Block>[]>(() => {
    return [
      {
        id: "height",
        label: echo("height"),
        render: (row) => (
          <Link href={`/block/${row.height}`} className="link">
            #{row.height}
          </Link>
        ),
      },
      {
        id: "hash",
        label: echo("hash"),
        render: (row) => stringTruncateMiddle(row.hash ?? "", 12, 8),
      },
      {
        id: "age",
        label: echo("age"),
        render: (row) => (row.date ? formatRelativeAge(unixToDate(row.date)) : "—"),
      },
      {
        id: "validator",
        label: echo("validatorAddress"),
        render: (row) =>
          row.validator_address ? (
            <Link href={`/address/${row.validator_address}`} className="link">
              {stringTruncateMiddle(row.validator_address, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "chain",
        label: echo("chainAddress"),
        render: (row) =>
          row.chain_address ? (
            <Link href={`/address/${row.chain_address}`} className="link">
              {stringTruncateMiddle(row.chain_address, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "protocol",
        label: echo("protocol"),
        render: (row) => row.protocol ?? "—",
      },
      {
        id: "date",
        label: echo("date"),
        render: (row) =>
          row.date ? formatDateTime(unixToDate(row.date)) : "—",
      },
    ];
  }, [echo]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("blocks")}</h1>
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
          tableId="PhantasmaExplorer-Blocks"
          columns={columns}
          rows={data?.blocks ?? []}
          raw={data?.blocks ?? []}
          loading={loading}
          error={Boolean(error || data?.error)}
          controls={{
            page: table.page,
            setPage: table.setPage,
            pageSize: table.pageSize,
            setPageSize: table.setPageSize,
            hasNext: table.hasNext,
            orderDirection: table.orderDirection,
            setOrderDirection: table.setOrderDirection,
          }}
        />
      </div>
    </AppShell>
  );
}
