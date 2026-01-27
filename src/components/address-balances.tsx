"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/data-table";
import type { Balance } from "@/lib/types/api";
import { numberFormat } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

interface AddressBalancesProps {
  balances?: Balance[];
}

export function AddressBalances({ balances }: AddressBalancesProps) {
  const { echo } = useEcho();

  const rows = useMemo(() => {
    if (!balances?.length) return [];
    return balances
      .filter((item) => item.amount && Number(item.amount) !== 0)
      .sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0));
  }, [balances]);

  const columns = useMemo<Column<Balance>[]>(() => {
    return [
      {
        id: "token",
        label: echo("token"),
        render: (row) =>
          row.token?.symbol ? (
            <div className="flex flex-col">
              <Link href={`/token/${row.token.symbol}`} className="text-sm font-semibold link">
                {row.token.symbol}
              </Link>
              {row.token.name ? (
                <span className="text-xs text-muted-foreground">{row.token.name}</span>
              ) : null}
            </div>
          ) : (
            "—"
          ),
      },
      {
        id: "chain",
        label: echo("chain"),
        render: (row) => row.chain?.chain_name ?? "—",
      },
      {
        id: "amount",
        label: echo("amount"),
        render: (row) => (row.amount ? numberFormat(row.amount, "0,0.[00000000]") : "—"),
      },
    ];
  }, [echo]);

  if (!rows.length) return null;

  return (
    <DataTable
      tableId="PhantasmaExplorer-Address-Balances"
      header={
        <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          {echo("tab-balances")}
        </div>
      }
      columns={columns}
      rows={rows}
      raw={rows}
      hideControls
    />
  );
}
