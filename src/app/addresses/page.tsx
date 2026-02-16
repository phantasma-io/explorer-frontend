"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Address, AddressResults } from "@/lib/types/api";
import { numberFormat, stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

const SOUL_SYMBOL = "SOUL";
const ASSETS = ["SOUL", "KCAL"] as const;
type AssetSymbol = (typeof ASSETS)[number];

const parseAmount = (value?: string): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getBalanceAmount = (address: Address, symbol: string): number => {
  /*
    For SOUL ranking, include staked SOUL so totals reflect overall holdings.
    Other assets only consider the liquid balance.
  */
  const balance = address.balances?.find(
    (item) => item.token?.symbol?.toUpperCase() === symbol.toUpperCase(),
  );

  const baseAmount = parseAmount(balance?.amount);
  if (symbol.toUpperCase() !== SOUL_SYMBOL) {
    return baseAmount;
  }

  const stakeAmount = parseAmount(address.stake);
  return baseAmount + stakeAmount;
};

export default function TopAccountsPage() {
  const { echo } = useEcho();
  const table = useTable();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [asset, setAsset] = useState<AssetSymbol>("SOUL");

  const { data, loading, error } = useApi<AddressResults>(
    endpoints.addresses({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: "balance",
      order_direction: "desc",
      symbol: asset,
      address_partial: query,
      with_balance: 1,
      with_stakes: 1,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.addresses?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.addresses?.length]);

  useEffect(() => {
    // Switching the asset changes ordering and dataset; restart pagination.
    table.resetPagination();
  }, [asset, table.resetPagination]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQuery(trimmed || undefined);
    table.resetPagination();
  };

  const rows = useMemo(() => {
    /*
      Filter out zero balances and enforce descending order for a true
      "Top Accounts" view.
    */
    const addresses = data?.addresses ?? [];
    return addresses
      .map((address) => ({ address, amount: getBalanceAmount(address, asset) }))
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map((entry) => entry.address);
  }, [data?.addresses, asset]);

  const columns = useMemo<Column<Address>[]>(() => {
    return [
      {
        id: "address",
        label: echo("address"),
        render: (row) =>
          row.address ? (
            <Link href={`/address/${row.address}`} className="link">
              {stringTruncateMiddle(row.address, 10, 8)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "name",
        label: echo("name"),
        render: (row) => row.address_name ?? "—",
      },
      {
        id: "balance",
        label: echo("balance"),
        render: (row) => `${numberFormat(getBalanceAmount(row, asset))} ${asset}`,
      },
      {
        id: "stake",
        label: echo("stake"),
        render: (row) => `${numberFormat(parseAmount(row.stake))} ${SOUL_SYMBOL}`,
      },
      {
        id: "unclaimed",
        label: echo("unclaimed"),
        render: (row) => `${numberFormat(parseAmount(row.unclaimed))} KCAL`,
      },
    ];
  }, [echo, asset]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("topAccounts")}</h1>
            <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
              <div className="w-full md:w-72">
                <ListSearch
                  value={search}
                  onChange={setSearch}
                  onSubmit={applySearch}
                  placeholder={echo("search")}
                />
              </div>
              <div className="flex rounded-full border border-border bg-card/85 p-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {ASSETS.map((token) => {
                  const isActive = asset === token;
                  return (
                    <button
                      key={token}
                      type="button"
                      onClick={() => setAsset(token)}
                      className={`rounded-full px-4 py-2 transition ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      aria-pressed={isActive}
                    >
                      {token}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DataTable
          tableId="PhantasmaExplorer-TopAccounts"
          columns={columns}
          rows={rows}
          raw={rows}
          loading={loading}
          error={Boolean(error || data?.error)}
          controls={{
            page: table.page,
            setPage: table.setPage,
            pageSize: table.pageSize,
            setPageSize: table.setPageSize,
            hasNext: table.hasNext,
          }}
        />
      </div>
    </AppShell>
  );
}
