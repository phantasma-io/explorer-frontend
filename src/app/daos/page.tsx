"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Dao, DaoResults } from "@/lib/types/api";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { formatDateTimeWithRelative, unixToDate } from "@/lib/utils/time";
import { useEcho } from "@/lib/i18n/use-echo";

export default function DaosPage() {
  const { echo } = useEcho();
  const table = useTable("offset");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);

  const { data, loading, error } = useApi<DaoResults>(
    endpoints.organizations({
      offset: table.offset,
      limit: table.pageSize,
      order_by: table.orderBy,
      order_direction: table.orderDirection,
      q,
      with_creation_event: 1,
      with_address: 1,
      with_total: 1,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.organizations?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.organizations?.length]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQ(trimmed || undefined);
    table.resetPagination();
  };

  const columns = useMemo<Column<Dao>[]>(() => {
    return [
      {
        id: "name",
        label: echo("name"),
        render: (row) => {
          const name = row.name ?? row.id ?? "—";
          return (
            <div className="min-w-0">
              <Link href={`/dao/${name}`} className="text-sm font-semibold link">
                {name}
              </Link>
              {row.address?.address_name ? (
                <div className="text-xs text-muted-foreground">{row.address.address_name}</div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "size",
        label: echo("size"),
        render: (row) => row.size ?? "—",
      },
      {
        id: "address",
        label: echo("address"),
        render: (row) =>
          row.address?.address ? (
            <Link href={`/address/${row.address.address}`} className="link">
              {stringTruncateMiddle(row.address.address, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "created",
        label: echo("date"),
        render: (row) =>
          row.create_event?.date
            ? formatDateTimeWithRelative(unixToDate(row.create_event.date))
            : "—",
      },
      {
        id: "transaction",
        label: echo("transaction"),
        render: (row) =>
          row.create_event?.transaction_hash ? (
            <Link href={`/tx/${row.create_event.transaction_hash}`} className="link">
              {stringTruncateMiddle(row.create_event.transaction_hash, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
    ];
  }, [echo]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("daos")}</h1>
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
          tableId="PhantasmaExplorer-DAOs"
          columns={columns}
          rows={data?.organizations ?? []}
          raw={data?.organizations ?? []}
          loading={loading}
          error={Boolean(error || data?.error)}
          controls={{
            page: table.page,
            setPage: table.setPage,
            pageSize: table.pageSize,
            setPageSize: table.setPageSize,
            hasNext: table.hasNext,
            orderBy: table.orderBy,
            setOrderBy: table.setOrderBy,
            orderDirection: table.orderDirection,
            setOrderDirection: table.setOrderDirection,
            orderByOptions: [
              { label: "Creation order", value: "id" },
              { label: "Name", value: "name" },
            ],
          }}
        />
      </div>
    </AppShell>
  );
}
