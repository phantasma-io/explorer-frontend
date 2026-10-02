"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/data-table";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Address, AddressResults } from "@/lib/types/api";
import { numberFormat } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

interface HoldersTableProps {
  symbol: string;
}

// The holders of one token, the largest balance first. A token can have any number
// of holders, so the table pages through them with the cursor. The API is asked for
// the holders only, so the cursor ends at the last holder.
export function HoldersTable({ symbol }: HoldersTableProps) {
  const { echo } = useEcho();
  const table = useTable();
  const { onPageData, resetPagination } = table;
  const previousSymbol = useRef(symbol);

  const { data, loading, error } = useApi<AddressResults>(
    endpoints.addresses({
      order_by: "balance",
      order_direction: "desc",
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      chain: "main",
      symbol,
      holders_only: 1,
      with_balance: 1,
    }),
  );

  useEffect(() => {
    onPageData(data?.next_cursor ?? null, data?.addresses?.length ?? 0);
  }, [onPageData, data?.next_cursor, data?.addresses?.length]);

  useEffect(() => {
    // Another token starts again from the first page of its holders.
    if (previousSymbol.current === symbol) return;
    previousSymbol.current = symbol;
    resetPagination();
  }, [resetPagination, symbol]);

  const symbolUpper = symbol.toUpperCase();
  const isSoul = symbolUpper === "SOUL";

  const extractAmount = useMemo(() => {
    return (address: Address) => {
      const balance = address.balances?.find(
        (item) => item.token?.symbol?.toUpperCase() === symbolUpper,
      );

      const baseAmount = Number(balance?.amount ?? 0);
      const stakeAmount = Number(address.stake ?? 0);

      // For SOUL holders, the explorer aggregates stake into the holding amount.
      const amount = isSoul ? baseAmount + stakeAmount : baseAmount;
      if (!Number.isFinite(amount)) return 0;
      return amount > 1 ? Math.floor(amount) : amount;
    };
  }, [isSoul, symbolUpper]);

  const rows = useMemo(() => {
    const addresses = data?.addresses ?? [];
    return addresses
      .map((address) => ({ address, amount: extractAmount(address) }))
      .sort((a, b) => b.amount - a.amount)
      .map((entry) => entry.address);
  }, [data?.addresses, extractAmount]);

  const columns = useMemo<Column<Address>[]>(() => {
    return [
      {
        id: "address",
        label: echo("address"),
        render: (row) => (
          <Link href={`/address/${row.address}`} className="link">
            {row.address ?? "—"}
          </Link>
        ),
      },
      {
        id: "name",
        label: echo("name"),
        render: (row) => row.address_name ?? "—",
      },
      {
        id: "amount",
        label: echo("amount"),
        render: (row) => `${numberFormat(extractAmount(row))} ${symbolUpper}`,
      },
    ];
  }, [echo, extractAmount, symbolUpper]);

  return (
    <DataTable
      tableId={`PhantasmaExplorer-Token-${symbolUpper}-Holders`}
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
  );
}
