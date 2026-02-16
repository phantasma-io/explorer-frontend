"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { TokenFlags } from "@/components/token-flags";
import { TokenMark } from "@/components/token-mark";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Token, TokenResults } from "@/lib/types/api";
import { numberFormat } from "@/lib/utils/format";
import { getTokenPrice } from "@/lib/utils/token";
import { useEcho } from "@/lib/i18n/use-echo";

export default function TokensPage() {
  const { echo } = useEcho();
  const table = useTable();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);

  const { data, loading, error } = useApi<TokenResults>(
    endpoints.tokens({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: table.orderBy,
      order_direction: table.orderDirection,
      with_logo: 1,
      with_price: 1,
      q,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.tokens?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.tokens?.length]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQ(trimmed || undefined);
    table.resetPagination();
  };

  const columns = useMemo<Column<Token>[]>(() => {
    return [
      {
        id: "token",
        label: echo("token"),
        render: (row) => (
          <div className="flex items-center gap-3">
            <TokenMark token={row} size="sm" />
            <div className="min-w-0">
              <Link href={`/token/${row.symbol}`} className="text-sm font-semibold link">
                {row.symbol ?? "—"}
              </Link>
              {row.name ? (
                <div className="text-xs text-muted-foreground">{row.name}</div>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: "type",
        label: echo("type"),
        render: (row) => (row.fungible === false ? echo("nft") : echo("fungible")),
      },
      {
        id: "supply",
        label: echo("currentSupply"),
        render: (row) => numberFormat(row.current_supply ?? "0"),
      },
      {
        id: "max",
        label: echo("maxSupply"),
        render: (row) => numberFormat(row.max_supply ?? "0"),
      },
      {
        id: "price",
        label: echo("price"),
        render: (row) => {
          const price = getTokenPrice(row.price);
          return price ? `${price.value} ${price.currency}` : "—";
        },
      },
      {
        id: "decimals",
        label: echo("decimals"),
        render: (row) => row.decimals ?? "—",
      },
      {
        id: "fungible",
        label: echo("capabilities"),
        render: (row) => <TokenFlags token={row} variant="inline" max={4} />,
      },
    ];
  }, [echo]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("tokens")}</h1>
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
          tableId="PhantasmaExplorer-Tokens"
          columns={columns}
          rows={data?.tokens ?? []}
          raw={data?.tokens ?? []}
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
              { label: "Symbol", value: "symbol" },
            ],
          }}
        />
      </div>
    </AppShell>
  );
}
