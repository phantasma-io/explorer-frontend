"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Contract, ContractResults } from "@/lib/types/api";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

export default function ContractsPage() {
  const { echo } = useEcho();
  const table = useTable("cursor");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);

  const { data, loading, error } = useApi<ContractResults>(
    endpoints.contracts({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: table.orderBy,
      order_direction: table.orderDirection,
      q,
      with_total: 1,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.contracts?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.contracts?.length]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQ(trimmed || undefined);
    table.resetPagination();
  };

  const columns = useMemo<Column<Contract>[]>(() => {
    return [
      {
        id: "name",
        label: echo("name"),
        render: (row) => (
          <Link href={`/contract/${row.hash ?? row.name}`} className="link">
            {row.name}
          </Link>
        ),
      },
      {
        id: "hash",
        label: echo("hash"),
        render: (row) => stringTruncateMiddle(row.hash ?? "", 10, 8),
      },
      {
        id: "symbol",
        label: echo("symbol"),
        render: (row) =>
          row.symbol ? (
            <Link href={`/token/${row.symbol}`} className="link">
              {row.symbol}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "type",
        label: echo("type"),
        render: (row) => row.type ?? "—",
      },
      {
        id: "compiler",
        label: echo("compiler"),
        render: (row) => row.compiler ?? "—",
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
    ];
  }, [echo]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("contracts")}</h1>
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
          tableId="PhantasmaExplorer-Contracts"
          columns={columns}
          rows={data?.contracts ?? []}
          raw={data?.contracts ?? []}
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
              { label: "ID", value: "id" },
              { label: "Hash", value: "hash" },
            ],
          }}
        />
      </div>
    </AppShell>
  );
}
