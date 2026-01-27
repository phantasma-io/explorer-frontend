"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/data-table";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { Address, AddressResults } from "@/lib/types/api";
import { numberFormat } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

interface HoldersTableProps {
  symbol: string;
  limit?: number;
}

export function HoldersTable({ symbol, limit = 100 }: HoldersTableProps) {
  const { echo } = useEcho();

  const { data, loading, error } = useApi<AddressResults>(
    endpoints.addresses({
      order_by: "balance",
      order_direction: "desc",
      offset: 0,
      limit,
      chain: "main",
      symbol,
      with_balance: 1,
    }),
  );

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
      rows={data?.addresses ?? []}
      raw={data?.addresses ?? []}
      loading={loading}
      error={Boolean(error || data?.error)}
      hideControls
    />
  );
}
