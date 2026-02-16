"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { NotFoundPanel } from "@/components/not-found-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { isNotFoundError } from "@/lib/api/fetcher";
import { useApi } from "@/lib/hooks/use-api";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { DaoResults } from "@/lib/types/api";
import { formatDateTimeWithRelative, unixToDate } from "@/lib/utils/time";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { useEcho } from "@/lib/i18n/use-echo";

export default function DaoPage() {
  const { echo } = useEcho();
  const { config } = useExplorerConfig();
  const nameParam = useRouteParam("name");
  const daoEndpoint = nameParam
    ? endpoints.organizations({
        organization_name: nameParam,
        with_creation_event: 1,
        with_address: 1,
      })
    : null;
  const explorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, daoEndpoint),
    [config.apiBaseUrl, daoEndpoint],
  );
  const rpcUrl = useMemo(
    () =>
      nameParam
        ? buildRpcUrl(
            config.nexus,
            "GetOrganizationByName",
            { name: nameParam },
            config.rpcBaseUrl,
          )
        : null,
    [config.nexus, config.rpcBaseUrl, nameParam],
  );

  const { data, loading, error } = useApi<DaoResults>(daoEndpoint);
  const isNotFound = isNotFoundError(error);
  const dao = data?.organizations?.[0];

  const overviewItems = useMemo(() => {
    if (!dao) return [];
    return [
      { label: echo("name"), value: dao.name ?? dao.id ?? "—" },
      { label: echo("size"), value: dao.size ?? "—" },
      { label: echo("addressName"), value: dao.address?.address_name ?? "—" },
      {
        label: echo("address"),
        value: dao.address?.address ? (
          <Link href={`/address/${dao.address.address}`} className="link">
            {dao.address.address}
          </Link>
        ) : (
          "—"
        ),
      },
    ];
  }, [dao, echo]);

  const creationItems = useMemo(() => {
    if (!dao?.create_event) return [];
    const event = dao.create_event;
    return [
      { label: echo("event_kind"), value: event.event_kind ?? "—" },
      { label: echo("event_id"), value: event.event_id ?? "—" },
      {
        label: echo("date"),
        value: event.date ? formatDateTimeWithRelative(unixToDate(event.date)) : "—",
      },
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
        value: event.contract?.hash || event.contract?.name ? (
          <Link href={`/contract/${event.contract.hash ?? event.contract.name}`} className="link">
            {event.contract.name ?? event.contract.hash}
          </Link>
        ) : (
          "—"
        ),
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
    ];
  }, [dao?.create_event, echo]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="grid gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-end gap-4">
                {dao ? (
                  <ExportButton
                    data={[dao]}
                    filename={`PhantasmaExplorer-DAO-${nameParam}.csv`}
                    label={echo("table-exportCsv")}
                  />
                ) : null}
              </div>
              <div className="mt-4">
                {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                {error && <div className="text-sm text-destructive">Failed to load DAO.</div>}
                {dao ? <DetailList items={overviewItems} /> : null}
              </div>
            </div>
            {creationItems.length ? (
              <div className="glass-panel rounded-2xl p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  {echo("details-dao")}
                </div>
                <div className="mt-4">
                  <DetailList items={creationItems} />
                </div>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: <RawJsonPanel data={dao} rpcUrl={rpcUrl} explorerUrl={explorerUrl} />,
      },
    ],
    [creationItems, dao, echo, error, explorerUrl, loading, nameParam, overviewItems, rpcUrl],
  );

  // TODO: Restore a Members tab once the Explorer API/RPC reliably returns DAO membership data.

  if (isNotFound || (!loading && !error && !dao)) {
    return (
      <AppShell>
        <NotFoundPanel description="DAO was not found." />
      </AppShell>
    );
  }

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("dao")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-all text-xl font-semibold">{dao?.name ?? nameParam}</h1>
        <CopyButton value={dao?.name ?? nameParam} />
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
