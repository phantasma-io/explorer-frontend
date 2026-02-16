"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { MetadataPanel } from "@/components/metadata-panel";
import { NotFoundPanel } from "@/components/not-found-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { isNotFoundError } from "@/lib/api/fetcher";
import { useApi } from "@/lib/hooks/use-api";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { SeriesResults } from "@/lib/types/api";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { numberFormat } from "@/lib/utils/format";
import { buildSeriesSupplyMetrics } from "@/lib/utils/series-supply";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { useEcho } from "@/lib/i18n/use-echo";

export default function SeriesPage() {
  const { echo } = useEcho();
  const { config } = useExplorerConfig();
  const seriesId = useRouteParam("id");
  const seriesEndpoint = seriesId ? endpoints.series({ id: seriesId }) : null;
  const explorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, seriesEndpoint),
    [config.apiBaseUrl, seriesEndpoint],
  );
  const { data, loading, error } = useApi<SeriesResults>(seriesEndpoint);
  const isNotFound = isNotFoundError(error);

  const series = data?.series?.[0];
  const seriesSymbol = series?.symbol ?? null;
  const rpcUrl = useMemo(() => {
    if (!seriesSymbol) return null;
    // RPC does not expose series by id directly; link to token series list for the series token.
    return buildRpcUrl(config.nexus, "GetTokenSeries", {
      symbol: seriesSymbol,
      pageSize: 10,
    }, config.rpcBaseUrl);
  }, [config.nexus, config.rpcBaseUrl, seriesSymbol]);

  const items = useMemo(() => {
    if (!series) return [];
    return [
      { label: echo("series"), value: series.id ?? "—" },
      {
        label: echo("created_at"),
        value: series.created_unix_seconds
          ? formatDateTime(unixToDate(series.created_unix_seconds))
          : "—",
      },
      { label: echo("name"), value: series.name ?? "—" },
      { label: echo("description"), value: series.description ?? "—" },
      {
        label: echo("creator"),
        value: series.creator ? (
          <Link href={`/address/${series.creator}`} className="link">
            {series.creator}
          </Link>
        ) : "—",
      },
      { label: echo("chain"), value: series.chain ?? "—" },
      {
        label: echo("symbol"),
        value: series.symbol ? (
          <Link href={`/token/${series.symbol}`} className="link">
            {series.symbol}
          </Link>
        ) : "—",
      },
      {
        label: echo("contract"),
        value: series.contract ? (
          <Link href={`/contract/${series.contract}`} className="link">
            {series.contract}
          </Link>
        ) : "—",
      },
      { label: echo("mode_name"), value: series.mode_name ?? "—" },
      { label: echo("royalties"), value: series.royalties ?? "—" },
      { label: echo("attr_type_1"), value: series.attr_type_1 ?? "—" },
      { label: echo("attr_value_1"), value: series.attr_value_1 ?? "—" },
      { label: echo("attr_type_2"), value: series.attr_type_2 ?? "—" },
      { label: echo("attr_value_2"), value: series.attr_value_2 ?? "—" },
      { label: echo("attr_type_3"), value: series.attr_type_3 ?? "—" },
      { label: echo("attr_value_3"), value: series.attr_value_3 ?? "—" },
    ];
  }, [series, echo]);

  const supplyMetrics = useMemo(
    () => buildSeriesSupplyMetrics(series?.current_supply, series?.max_supply),
    [series?.current_supply, series?.max_supply],
  );

  const supplyOverview = [
    {
      label: echo("current_supply"),
      value:
        supplyMetrics.current !== null
          ? numberFormat(supplyMetrics.current, "0,0")
          : "—",
    },
    {
      label: echo("max_supply"),
      value:
        supplyMetrics.max !== null ? numberFormat(supplyMetrics.max, "0,0") : "—",
    },
    {
      label: echo("remaining_supply"),
      value:
        supplyMetrics.remaining !== null
          ? numberFormat(supplyMetrics.remaining, "0,0")
          : "—",
    },
  ];

  const tabs = [
    {
      id: "overview",
      label: echo("tab-overview"),
      content: (
        <div className="grid gap-6">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-end gap-4">
              {series ? (
                <ExportButton
                  data={[series]}
                  filename={`PhantasmaExplorer-Series-${seriesId}.csv`}
                  label={echo("table-exportCsv")}
                />
              ) : null}
            </div>
            <div className="mt-4">
              {loading && <div className="text-sm text-muted-foreground">{echo("loading")}</div>}
              {error && <div className="text-sm text-destructive">{echo("failed_to_load_series")}</div>}
              {series ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    {supplyOverview.map((entry) => (
                      <div
                        key={entry.label}
                        className="rounded-xl border border-border/60 bg-muted/30 p-4"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {entry.label}
                        </div>
                        <div className="mt-2 text-xl font-semibold text-foreground">
                          {entry.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {echo("supply_progress")}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {supplyMetrics.percent !== null
                          ? `${numberFormat(supplyMetrics.percent, "0,0.[00]")}%`
                          : "—"}
                      </div>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500/80 transition-[width]"
                        style={{ width: `${supplyMetrics.percent ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <DetailList items={items} />
                </div>
              ) : null}
            </div>
          </div>
          {series?.image ? (
            <div className="glass-panel rounded-2xl p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                {echo("image")}
              </div>
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={series.image}
                  alt={series.name ?? "Series"}
                  className="w-full rounded-xl border border-border/60"
                  loading="lazy"
                />
              </div>
            </div>
          ) : null}
          <MetadataPanel title={echo("metadata-series")} data={series?.metadata} />
        </div>
      ),
    },
    {
      id: "raw",
      label: echo("tab-raw"),
      content: <RawJsonPanel data={series} rpcUrl={rpcUrl} explorerUrl={explorerUrl} />,
    },
  ];

  if (isNotFound || (!loading && !error && !series)) {
    return (
      <AppShell>
        <NotFoundPanel description={echo("not_found_series")} />
      </AppShell>
    );
  }

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("series")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{series?.name ?? seriesId}</h1>
        {series?.series_id ? (
          <span className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">
            #{series.series_id}
          </span>
        ) : null}
        <CopyButton value={seriesId} />
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
