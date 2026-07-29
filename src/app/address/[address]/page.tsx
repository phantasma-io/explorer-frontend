"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AddressBalances } from "@/components/address-balances";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { NotFoundPanel } from "@/components/not-found-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { EventsTable } from "@/components/events-table";
import { ListSearch } from "@/components/list-search";
import { TransactionsTable } from "@/components/transactions-table";
import { ComboSelect } from "@/components/ui/combo-select";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { isNotFoundError } from "@/lib/api/fetcher";
import { useApi } from "@/lib/hooks/use-api";
import { useEventKindOptions } from "@/lib/hooks/use-event-kind-options";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { AddressResults } from "@/lib/types/api";
import { numberFormat } from "@/lib/utils/format";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { useEcho } from "@/lib/i18n/use-echo";

export default function AddressPage() {
  const { echo } = useEcho();
  const { config } = useExplorerConfig();
  const addressParam = useRouteParam("address");
  const addressEndpoint = addressParam
    ? endpoints.addresses({
        address: addressParam,
        with_balance: 1,
        with_stakes: 1,
      })
    : null;
  const explorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, addressEndpoint),
    [config.apiBaseUrl, addressEndpoint],
  );
  const rpcUrl = useMemo(
    () =>
      addressParam
        ? buildRpcUrl(
            config.nexus,
            "GetAccountInfo",
            { account: addressParam },
            config.rpcBaseUrl,
          )
        : null,
    [addressParam, config.nexus, config.rpcBaseUrl],
  );
  const { data, loading, error } = useApi<AddressResults>(addressEndpoint);
  const isNotFound = isNotFoundError(error);

  const addressEntry = data?.addresses?.[0];
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionQuery, setTransactionQuery] = useState<string | undefined>(undefined);
  const [eventSearch, setEventSearch] = useState("");
  const [eventQuery, setEventQuery] = useState<string | undefined>(undefined);
  const [eventKind, setEventKind] = useState("");
  const { options: eventKindOptions } = useEventKindOptions(true);

  const items = useMemo(() => {
    if (!addressEntry) return [];
    return [
      {
        label: echo("address"),
        value: addressEntry.address ? (
          <span className="inline-flex items-center gap-2 break-all">
            <span>{addressEntry.address}</span>
            <CopyButton value={addressEntry.address} />
          </span>
        ) : (
          "—"
        ),
      },
      { label: echo("name"), value: addressEntry.address_name ?? "—" },
      {
        label: echo("stake"),
        value: addressEntry.stake ? `${numberFormat(addressEntry.stake)} SOUL` : "—",
      },
      {
        label: echo("unclaimed"),
        value: addressEntry.unclaimed ? `${numberFormat(addressEntry.unclaimed)} KCAL` : "—",
      },
    ];
  }, [addressEntry, echo]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="grid gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-end gap-4">
                {addressEntry ? (
                  <ExportButton
                    data={[addressEntry]}
                    filename={`PhantasmaExplorer-Address-${addressParam}.csv`}
                    label={echo("table-exportCsv")}
                  />
                ) : null}
              </div>
              <div className="mt-4">
                {loading && <div className="text-sm text-muted-foreground">{echo("loading")}</div>}
                {error && <div className="text-sm text-destructive">{echo("failed_to_load_address")}</div>}
                {addressEntry ? <DetailList items={items} /> : null}
              </div>
            </div>
            <AddressBalances balances={addressEntry?.balances} />
          </div>
        ),
      },
      {
        id: "transactions",
        label: echo("tab-transactions"),
        actions: (
          <div className="w-full max-w-sm">
            <ListSearch
              value={transactionSearch}
              onChange={setTransactionSearch}
              onSubmit={(value) => {
                const trimmed = value.trim();
                setTransactionSearch(trimmed);
                setTransactionQuery(trimmed || undefined);
              }}
              placeholder={echo("search")}
            />
          </div>
        ),
        content: (
          <TransactionsTable
            address={addressParam || undefined}
            chain=""
            showSearch={false}
            query={transactionQuery}
          />
        ),
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
            address={addressParam || undefined}
            showSearch={false}
            showEventKindFilter={false}
            query={eventQuery}
            eventKind={eventKind}
            withFiat={false}
          />
        ),
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: (
          <RawJsonPanel data={addressEntry} rpcUrl={rpcUrl} explorerUrl={explorerUrl} />
        ),
      },
    ],
    [
      addressEntry,
      addressParam,
      echo,
      error,
      eventKind,
      eventKindOptions,
      eventQuery,
      eventSearch,
      explorerUrl,
      items,
      loading,
      rpcUrl,
      transactionQuery,
      transactionSearch,
    ],
  );

  if (isNotFound || (!loading && !error && !addressEntry)) {
    return (
      <AppShell>
        <NotFoundPanel description={echo("not_found_address")} />
      </AppShell>
    );
  }

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("address")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-all text-xl font-semibold">{addressParam}</h1>
        <CopyButton value={addressParam} />
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
