"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { MetadataPanel } from "@/components/metadata-panel";
import { NotFoundPanel } from "@/components/not-found-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { SeriesResults } from "@/lib/types/api";
import { useEcho } from "@/lib/i18n/use-echo";

export default function SeriesPage() {
  const { echo } = useEcho();
  const seriesId = useRouteParam("id");
  const seriesEndpoint = seriesId ? endpoints.series({ series_id: seriesId }) : null;
  const { data, loading, error } = useApi<SeriesResults>(seriesEndpoint);

  const series = data?.series?.[0];

  const items = useMemo(() => {
    if (!series) return [];
    return [
      { label: echo("series"), value: series.id ?? "—" },
      { label: echo("name"), value: series.name ?? "—" },
      { label: echo("description"), value: series.description ?? "—" },
      { label: echo("creator"), value: series.creator ?? "—" },
      { label: echo("current_supply"), value: series.current_supply ?? "—" },
      { label: echo("max_supply"), value: series.max_supply ?? "—" },
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

  const tabs = useMemo(
    () => [
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
                {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                {error && <div className="text-sm text-destructive">Failed to load series.</div>}
                {series ? <DetailList items={items} /> : null}
              </div>
            </div>
            {series?.image ? (
              <div className="glass-panel rounded-2xl p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  {echo("image")}
                </div>
                <div className="mt-4">
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
        content: <RawJsonPanel data={series} />,
      },
    ],
    [echo, error, items, loading, series, seriesId],
  );

  if (!loading && !error && !series) {
    return (
      <AppShell>
        <NotFoundPanel description="Series was not found." />
      </AppShell>
    );
  }

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("series")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{seriesId}</h1>
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
