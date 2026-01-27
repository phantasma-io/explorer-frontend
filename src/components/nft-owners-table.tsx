"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/data-table";
import type { NftOwner } from "@/lib/types/api";
import { numberFormat, stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

interface NftOwnersTableProps {
  owners?: NftOwner[];
}

export function NftOwnersTable({ owners }: NftOwnersTableProps) {
  const { echo } = useEcho();

  const rows = useMemo(() => owners ?? [], [owners]);

  const columns = useMemo<Column<NftOwner>[]>(() => {
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
        label: echo("address_name"),
        render: (row) => row.onchain_name ?? "—",
      },
      {
        id: "amount",
        label: echo("amount"),
        render: (row) =>
          row.amount !== undefined ? numberFormat(row.amount, "0,0.[00000000]") : "—",
      },
    ];
  }, [echo]);

  if (!rows.length) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
        {echo("no-results")}
      </div>
    );
  }

  return (
    <DataTable
      tableId="PhantasmaExplorer-Nft-Owners"
      header={
        <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          {echo("owners")}
        </div>
      }
      columns={columns}
      rows={rows}
      raw={rows}
      hideControls
    />
  );
}
