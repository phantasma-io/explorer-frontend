"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { TransactionsExportButton } from "@/components/transactions-export";
import { TxStateBadge } from "@/components/tx-state-badge";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Transaction, TransactionResults } from "@/lib/types/api";
import { decodeBase16 } from "@/lib/utils/decode-base16";
import { formatDateTime, formatRelativeAge, unixToDate } from "@/lib/utils/time";
import { stringTruncate, stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

interface TransactionsTableProps {
  address?: string;
  blockHeight?: string;
  showSearch?: boolean;
  tableId?: string;
  enableKoinly?: boolean;
  title?: string;
  query?: string;
}

export function TransactionsTable({
  address,
  blockHeight,
  showSearch = true,
  tableId = "PhantasmaExplorer-Transactions",
  enableKoinly = true,
  title,
  query,
}: TransactionsTableProps) {
  const { echo } = useEcho();
  const table = useTable("cursor");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);
  const isQueryControlled = typeof query === "string";
  const activeQuery = isQueryControlled ? query : q;
  const previousQuery = useRef<string | undefined>(activeQuery);
  const previousScope = useRef<{ address?: string; blockHeight?: string }>({
    address,
    blockHeight,
  });

  const { data, loading, error } = useApi<TransactionResults>(
    endpoints.transactions({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: table.orderBy,
      order_direction: table.orderDirection,
      address,
      block_height: blockHeight,
      q: activeQuery,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.transactions?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.transactions?.length]);

  useEffect(() => {
    if (!isQueryControlled) return;
    if (previousQuery.current === activeQuery) return;
    previousQuery.current = activeQuery;
    table.resetPagination();
  }, [activeQuery, isQueryControlled, table]);

  useEffect(() => {
    if (
      previousScope.current.address === address &&
      previousScope.current.blockHeight === blockHeight
    ) {
      return;
    }
    // Scope changes (address/block) need a fresh cursor; otherwise pagination can stall.
    previousScope.current = { address, blockHeight };
    table.resetPagination();
  }, [address, blockHeight, table]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    if (!isQueryControlled) {
      setQ(trimmed || undefined);
    }
    table.resetPagination();
  };

  const columns = useMemo<Column<Transaction>[]>(() => {
    return [
      {
        id: "hash",
        label: echo("hash"),
        render: (row) => (
          <Link href={`/tx/${row.hash}`} className="link">
            {stringTruncateMiddle(row.hash ?? "", 10, 8)}
          </Link>
        ),
      },
      {
        id: "block",
        label: echo("block_height"),
        render: (row) => (
          <Link href={`/block/${row.block_height}`} className="link">
            {row.block_height}
          </Link>
        ),
      },
      {
        id: "age",
        label: echo("age"),
        render: (row) => (row.date ? formatRelativeAge(unixToDate(row.date)) : "—"),
      },
      {
        id: "state",
        label: echo("state"),
        render: (row) => <TxStateBadge state={row.state} />,
      },
      {
        id: "fee",
        label: echo("fee"),
        render: (row) => (row.fee ? `${row.fee} KCAL` : "—"),
      },
      {
        id: "date",
        label: echo("date"),
        render: (row) => (row.date ? formatDateTime(unixToDate(row.date)) : "—"),
      },
      {
        id: "result",
        label: echo("result"),
        render: (row) =>
          row.result ? (
            <span title={row.result}>{stringTruncate(row.result, 48)}</span>
          ) : (
            "—"
          ),
      },
      {
        id: "payload",
        label: echo("payload"),
        render: (row) => {
          const decoded = row.payload ? decodeBase16(row.payload) : "";
          return decoded ? <span title={decoded}>{stringTruncate(decoded, 64)}</span> : "—";
        },
      },
    ];
  }, [echo]);

  const header = title ? (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {showSearch ? (
        <div className="w-full max-w-sm">
          <ListSearch
            value={search}
            onChange={setSearch}
            onSubmit={applySearch}
            placeholder={echo("search")}
          />
        </div>
      ) : null}
    </div>
  ) : null;

  const exporter = address && enableKoinly ? (
    <TransactionsExportButton address={address} rawTransactions={data?.transactions ?? []} />
  ) : undefined;

  return (
    <div className="grid gap-4">
      {!title && showSearch ? (
        <div className="flex items-center justify-end">
          <div className="w-full max-w-sm">
            <ListSearch
              value={search}
              onChange={setSearch}
              onSubmit={applySearch}
              placeholder={echo("search")}
            />
          </div>
        </div>
      ) : null}
      <DataTable
        header={header}
        tableId={tableId}
        columns={columns}
        rows={data?.transactions ?? []}
        raw={data?.transactions ?? []}
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
          exporter,
        }}
      />
    </div>
  );
}
