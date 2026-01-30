"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { EventTypeDetails } from "@/components/event-type-details";
import { ExportButton } from "@/components/export-button";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { EventResults } from "@/lib/types/api";
import { formatDateTimeWithRelative, unixToDate } from "@/lib/utils/time";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { useEcho } from "@/lib/i18n/use-echo";

export default function EventPage() {
  const { echo } = useEcho();
  const { config } = useExplorerConfig();
  const eventId = useRouteParam("id");
  const eventEndpoint = eventId
    ? endpoints.events({
        event_id: eventId,
        with_event_data: 1,
        with_fiat: 1,
      })
    : null;
  const explorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, eventEndpoint),
    [config.apiBaseUrl, eventEndpoint],
  );
  const { data, loading, error } = useApi<EventResults>(eventEndpoint);

  const event = data?.events?.[0];
  const rpcUrl = useMemo(
    () =>
      event?.transaction_hash
        ? buildRpcUrl(
            config.nexus,
            "GetTransaction",
            { hashText: event.transaction_hash },
            config.rpcBaseUrl,
          )
        : null,
    [config.nexus, config.rpcBaseUrl, event?.transaction_hash],
  );

  const overviewItems = useMemo(() => {
    if (!event) return [];
    return [
      { label: echo("event_id"), value: event.event_id ?? "—" },
      { label: echo("event_kind"), value: event.event_kind ?? "—" },
      {
        label: echo("date"),
        value: event.date ? formatDateTimeWithRelative(unixToDate(event.date)) : "—",
      },
      {
        label: echo("address"),
        value: event.address ? (
          <Link href={`/address/${event.address}`} className="link">
            {event.address}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("address_name"), value: event.address_name ?? "—" },
      {
        label: echo("block_hash"),
        value: event.block_hash ? (
          <Link href={`/block/${event.block_hash}`} className="link">
            {event.block_hash}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("transaction_hash"),
        value: event.transaction_hash ? (
          <Link href={`/tx/${event.transaction_hash}`} className="link">
            {event.transaction_hash}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("chain"), value: event.chain ?? "—" },
      {
        label: echo("contract"),
        value: event.contract?.hash ? (
          <Link href={`/contract/${event.contract.hash}`} className="link">
            {event.contract.name ?? event.contract.hash}
          </Link>
        ) : (
          event.contract?.name ?? "—"
        ),
      },
      {
        label: echo("token"),
        value: event.token_event?.token?.symbol ? (
          <Link href={`/token/${event.token_event.token.symbol}`} className="link">
            {event.token_event.token.symbol}
          </Link>
        ) : (
          event.token_id ?? "—"
        ),
      },
      {
        label: echo("token_id"),
        value: event.token_id ? (
          event.token_event?.token?.fungible === false || event.nft_metadata ? (
            <Link href={`/nft/${event.token_id}`} className="link">
              {event.token_id}
            </Link>
          ) : (
            event.token_id
          )
        ) : (
          "—"
        ),
      },
      {
        label: echo("series"),
        value: event.series?.id ? (
          <Link href={`/series/${event.series.id}`} className="link">
            {event.series.name ?? event.series.id}
          </Link>
        ) : (
          "—"
        ),
      },
    ];
  }, [event, echo]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-end gap-4">
              {event ? (
                <ExportButton
                  data={[event]}
                  filename={`PhantasmaExplorer-Event-${eventId}.csv`}
                  label={echo("table-exportCsv")}
                />
              ) : null}
            </div>
            <div className="mt-4">
              {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {error && <div className="text-sm text-destructive">Failed to load event.</div>}
              {event ? <DetailList items={overviewItems} /> : null}
            </div>
          </div>
        ),
      },
      {
        id: "details",
        label: echo("details"),
        content: event ? (
          <div className="glass-panel rounded-2xl p-6">
            <div className="mt-4">
              <EventTypeDetails event={event} />
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
            {loading ? "Loading…" : "No details available."}
          </div>
        ),
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: <RawJsonPanel data={event} rpcUrl={rpcUrl} explorerUrl={explorerUrl} />,
      },
    ],
    [echo, event, eventId, loading, error, overviewItems, rpcUrl, explorerUrl],
  );

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("event")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">#{eventId}</h1>
        <CopyButton value={eventId} />
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
