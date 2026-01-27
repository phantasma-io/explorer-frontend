"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { EventActivity } from "@/components/event-activity";
import { EventSummary } from "@/components/event-summary";
import { ExportButton } from "@/components/export-button";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { EventsTable } from "@/components/events-table";
import { ListSearch } from "@/components/list-search";
import { SectionTabs } from "@/components/section-tabs";
import { TxStateBadge } from "@/components/tx-state-badge";
import { ComboSelect } from "@/components/ui/combo-select";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useEventKindOptions } from "@/lib/hooks/use-event-kind-options";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { TransactionResults } from "@/lib/types/api";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { decodeBase16 } from "@/lib/utils/decode-base16";
import { useEcho } from "@/lib/i18n/use-echo";

export default function TransactionPage() {
  const { echo } = useEcho();
  const router = useRouter();
  const hashParam = useRouteParam("hash");
  const txEndpoint = hashParam
    ? endpoints.transactions({
        hash: hashParam,
        with_events: 1,
        with_event_data: 1,
        with_fiat: 1,
        with_nft: 1,
      })
    : null;
  const { data, loading, error } = useApi<TransactionResults>(txEndpoint);

  const tx = data?.transactions?.[0];
  const [eventSearch, setEventSearch] = useState("");
  const [eventQuery, setEventQuery] = useState<string | undefined>(undefined);
  const [eventKind, setEventKind] = useState("");
  const { options: eventKindOptions } = useEventKindOptions(true);

  const overviewItems = useMemo(() => {
    if (!tx) return [];
    return [
      { label: echo("hash"), value: tx.hash },
      {
        label: echo("block_height"),
        value: tx.block_height ? (
          <Link href={`/block/${tx.block_height}`} className="link">
            {tx.block_height}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("block_hash"),
        value: tx.block_hash ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/block/${tx.block_hash}`} className="link">
              {tx.block_hash}
            </Link>
            <CopyButton value={tx.block_hash} />
          </div>
        ) : (
          "—"
        ),
      },
      {
        label: echo("date"),
        value: tx.date ? formatDateTime(unixToDate(tx.date)) : "—",
      },
      {
        label: echo("sender"),
        value: tx.sender?.address ? (
          <Link href={`/address/${tx.sender.address}`} className="link">
            {tx.sender.address}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("gas_target"),
        value: tx.gas_target?.address ? (
          <Link href={`/address/${tx.gas_target.address}`} className="link">
            {tx.gas_target.address}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("gas_payer"),
        value: tx.gas_payer?.address ? (
          <Link href={`/address/${tx.gas_payer.address}`} className="link">
            {tx.gas_payer.address}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("gas_price"), value: tx.gas_price ?? "—" },
      { label: echo("gas_limit"), value: tx.gas_limit ?? "—" },
      { label: echo("fee"), value: tx.fee ?? "—" },
      { label: echo("state"), value: <TxStateBadge state={tx.state} /> },
      {
        label: echo("result"),
        value: tx.result ? <span className="break-all">{tx.result}</span> : "—",
      },
      { label: echo("index"), value: tx.index ?? "—" },
      { label: echo("payload"), value: tx.payload ? decodeBase16(tx.payload) : "—" },
    ];
  }, [tx, echo]);

  const advancedItems = useMemo(() => {
    if (!tx) return [];
    const expiration = tx.expiration && tx.expiration !== "0" ? formatDateTime(unixToDate(tx.expiration)) : "—";
    return [
      { label: echo("gas_limit"), value: tx.gas_limit ? `${tx.gas_limit} KCAL` : "unlimited" },
      { label: echo("gas_price"), value: tx.gas_price ?? "—" },
      {
        label: echo("gas_target"),
        value: tx.gas_target?.address ? (
          <Link href={`/address/${tx.gas_target.address}`} className="link">
            {tx.gas_target.address}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("gas_payer"),
        value: tx.gas_payer?.address ? (
          <Link href={`/address/${tx.gas_payer.address}`} className="link">
            {tx.gas_payer.address}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("sender"),
        value: tx.sender?.address ? (
          <Link href={`/address/${tx.sender.address}`} className="link">
            {tx.sender.address}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("date"), value: tx.date ? formatDateTime(unixToDate(tx.date)) : "—" },
      { label: echo("expiration"), value: expiration },
      { label: echo("fee"), value: tx.fee ?? "—" },
    ];
  }, [tx, echo]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="grid gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  {echo("tab-overview")}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tx ? (
                    <ExportButton
                      data={[tx]}
                      filename={`PhantasmaExplorer-Transaction-${hashParam}.csv`}
                      label={echo("table-exportCsv")}
                    />
                  ) : null}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => tx?.previous_hash && router.push(`/tx/${tx.previous_hash}`)}
                      disabled={!tx?.previous_hash}
                      aria-label="Previous transaction"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => tx?.next_hash && router.push(`/tx/${tx.next_hash}`)}
                      disabled={!tx?.next_hash}
                      aria-label="Next transaction"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                {error && <div className="text-sm text-destructive">Failed to load transaction.</div>}
                {tx ? <DetailList items={overviewItems} /> : null}
              </div>
            </div>
            <EventSummary events={tx?.events} />
          </div>
        ),
      },
      {
        id: "advanced",
        label: echo("tab-advanced"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              {echo("tab-advanced")}
            </div>
            <div className="mt-4">{tx ? <DetailList items={advancedItems} /> : null}</div>
          </div>
        ),
      },
      {
        id: "activity",
        label: echo("activity"),
        content: <EventActivity events={tx?.events} />,
      },
      {
        id: "events",
        label: echo("tab-events"),
        actions: (
          <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
            <div className="w-full md:w-72">
              <ListSearch
                value={eventSearch}
                onChange={setEventSearch}
                onSubmit={(value) => {
                  const trimmed = value.trim();
                  setEventSearch(trimmed);
                  setEventQuery(trimmed || undefined);
                }}
                placeholder={echo("search")}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {echo("event_kind_short")}
              <ComboSelect
                value={eventKind}
                onChange={(value) => {
                  const nextValue = value === "__loading" || value === "__empty" ? "" : value;
                  setEventKind(nextValue);
                }}
                options={eventKindOptions}
                triggerClassName="border-0 bg-transparent px-0 py-0 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-none"
                contentClassName="min-w-[12rem]"
              />
            </div>
          </div>
        ),
        content: (
          <EventsTable
            transactionHash={hashParam || undefined}
            showSearch={false}
            showEventKindFilter={false}
            query={eventQuery}
            eventKind={eventKind}
          />
        ),
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: <RawJsonPanel data={tx} />,
      },
    ],
    [
      advancedItems,
      echo,
      error,
      eventKind,
      eventKindOptions,
      eventQuery,
      eventSearch,
      hashParam,
      loading,
      overviewItems,
      router,
      tx,
    ],
  );

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("transaction")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-all text-xl font-semibold">{hashParam}</h1>
        <CopyButton value={hashParam} />
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="grid gap-8">
        <SectionTabs tabs={tabs} header={header} />
      </div>
    </AppShell>
  );
}
