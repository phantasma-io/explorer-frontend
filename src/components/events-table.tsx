"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { ComboSelect, type ComboOption } from "@/components/ui/combo-select";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useEventKindOptions } from "@/lib/hooks/use-event-kind-options";
import { useTable } from "@/lib/hooks/use-table";
import type { EventResult, EventResults } from "@/lib/types/api";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

interface EventsTableProps {
  address?: string;
  blockHeight?: string;
  transactionHash?: string;
  chain?: string;
  showSearch?: boolean;
  showEventKindFilter?: boolean;
  tableId?: string;
  title?: string;
  query?: string;
  eventKind?: string;
  withFiat?: boolean;
}

export function EventsTable({
  address,
  blockHeight,
  transactionHash,
  chain = "",
  showSearch = true,
  showEventKindFilter = true,
  tableId = "PhantasmaExplorer-Events",
  title,
  query,
  eventKind,
  withFiat = true,
}: EventsTableProps) {
  const { echo } = useEcho();
  const table = useTable("cursor");
  const initializedOrder = useRef(false);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);
  const [eventKindState, setEventKindState] = useState<string>("");
  const isQueryControlled = typeof query === "string";
  const isEventKindControlled = typeof eventKind === "string";
  const activeQuery = isQueryControlled ? query : q;
  const activeEventKind = isEventKindControlled ? eventKind : eventKindState;
  const previousQuery = useRef<string | undefined>(activeQuery);
  const previousEventKind = useRef<string | undefined>(activeEventKind);
  const previousScope = useRef<{ address?: string; blockHeight?: string; transactionHash?: string; chain?: string }>({
    address,
    blockHeight,
    transactionHash,
    chain,
  });

  const { data, loading, error } = useApi<EventResults>(
    endpoints.events({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: table.orderBy,
      order_direction: table.orderDirection,
      chain: chain || undefined,
      with_event_data: 1,
      with_fiat: withFiat ? 1 : 0,
      address,
      block_height: blockHeight,
      transaction_hash: transactionHash,
      event_kind: activeEventKind || undefined,
      q: activeQuery,
    }),
  );
  const { options: eventKindOptions } = useEventKindOptions(showEventKindFilter, chain);

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.events?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.events?.length]);

  useEffect(() => {
    if (!isQueryControlled) return;
    if (previousQuery.current === activeQuery) return;
    previousQuery.current = activeQuery;
    table.resetPagination();
  }, [activeQuery, isQueryControlled, table]);

  useEffect(() => {
    if (!isEventKindControlled) return;
    if (previousEventKind.current === activeEventKind) return;
    previousEventKind.current = activeEventKind;
    table.resetPagination();
  }, [activeEventKind, isEventKindControlled, table]);

  useEffect(() => {
    if (
      previousScope.current.address === address &&
      previousScope.current.blockHeight === blockHeight &&
      previousScope.current.transactionHash === transactionHash &&
      previousScope.current.chain === chain
    ) {
      return;
    }
    // Scope changes (address/block/tx) need a fresh cursor to avoid stale pagination.
    previousScope.current = { address, blockHeight, transactionHash, chain };
    table.resetPagination();
  }, [address, blockHeight, chain, table, transactionHash]);

  useEffect(() => {
    if (initializedOrder.current) return;
    // Events should default to most recent first; set this once on first render.
    initializedOrder.current = true;
    table.setOrderBy("date");
    table.setOrderDirection("desc");
  }, [table]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    if (!isQueryControlled) {
      setQ(trimmed || undefined);
    }
    table.resetPagination();
  };

  const blockHref = (blockHash?: string, chainName?: string) => {
    if (!blockHash) return "/blocks";
    const normalizedChain = (chainName ?? "").trim().toLowerCase();
    return normalizedChain && normalizedChain !== "main"
      ? `/block/${blockHash}?chain=${encodeURIComponent(normalizedChain)}`
      : `/block/${blockHash}`;
  };

  const columns = useMemo<Column<EventResult>[]>(() => {
    return [
      {
        id: "kind",
        label: echo("event_kind"),
        render: (row) =>
          row.event_id ? (
            <Link href={`/event/${row.event_id}`} className="link">
              {row.event_kind ?? "—"}
            </Link>
          ) : (
            row.event_kind ?? "—"
          ),
      },
      {
        id: "address",
        label: echo("address"),
        render: (row) =>
          row.address ? (
            <Link href={`/address/${row.address}`} className="link">
              {stringTruncateMiddle(row.address, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "address_name",
        label: echo("address_name"),
        render: (row) => row.address_name ?? "—",
      },
      {
        id: "chain",
        label: echo("chain"),
        render: (row) => row.chain ?? "—",
      },
      {
        id: "contract",
        label: echo("contract"),
        render: (row) =>
          row.contract?.hash ? (
            <Link href={`/contract/${row.contract.hash}`} className="link">
              {row.contract?.name ?? row.contract.hash}
            </Link>
          ) : (
            row.contract?.name ?? "—"
          ),
      },
      {
        id: "block",
        label: echo("block_hash"),
        render: (row) =>
          row.block_hash ? (
            <Link href={blockHref(row.block_hash, row.chain)} className="link">
              {stringTruncateMiddle(row.block_hash, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "tx",
        label: echo("transaction_hash"),
        render: (row) =>
          row.transaction_hash ? (
            <Link href={`/tx/${row.transaction_hash}`} className="link">
              {stringTruncateMiddle(row.transaction_hash, 8, 6)}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "date",
        label: echo("date"),
        render: (row) => (row.date ? formatDateTime(unixToDate(row.date)) : "—"),
      },
    ];
  }, [echo, blockHref]);

  const eventKindOptionsMemo = useMemo<ComboOption[]>(() => eventKindOptions, [eventKindOptions]);
  const header = title ? (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {(showSearch || showEventKindFilter) && (
        <div className="flex flex-wrap items-center justify-end gap-3">
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
          {showEventKindFilter ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {echo("event_kind_short")}
              <ComboSelect
                value={activeEventKind}
                onChange={(value) => {
                  if (!isEventKindControlled) {
                    setEventKindState(value === "__loading" || value === "__empty" ? "" : value);
                    table.resetPagination();
                  }
                }}
                options={eventKindOptionsMemo}
                triggerClassName="border-0 bg-transparent px-0 py-0 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-none"
                contentClassName="min-w-[12rem]"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  ) : null;


  return (
    <div className="grid gap-4">
      {!title && (showSearch || showEventKindFilter) && (
        <div className="flex flex-wrap items-center justify-end gap-3">
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
          {showEventKindFilter ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {echo("event_kind_short")}
              <ComboSelect
                value={activeEventKind}
                onChange={(value) => {
                  if (!isEventKindControlled) {
                    setEventKindState(value === "__loading" || value === "__empty" ? "" : value);
                    table.resetPagination();
                  }
                }}
                options={eventKindOptionsMemo}
                triggerClassName="border-0 bg-transparent px-0 py-0 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-none"
                contentClassName="min-w-[12rem]"
              />
            </div>
          ) : null}
        </div>
      )}
      <DataTable
        header={header}
        tableId={tableId}
        columns={columns}
        rows={data?.events ?? []}
        raw={data?.events ?? []}
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
  );
}
