"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { MetadataPanel } from "@/components/metadata-panel";
import { NftOwnersTable } from "@/components/nft-owners-table";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { NftResults } from "@/lib/types/api";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { useEcho } from "@/lib/i18n/use-echo";

export default function NftPage() {
  const { echo } = useEcho();
  const tokenId = useRouteParam("id");
  const nftEndpoint = tokenId
    ? endpoints.nfts({ token_id: tokenId, with_logo: 1, with_price: 1 })
    : null;
  const { data, loading, error } = useApi<NftResults>(nftEndpoint);

  const nft = data?.nfts?.[0];

  const items = useMemo(() => {
    if (!nft) return [];
    return [
      { label: echo("token_id"), value: nft.token_id ?? "—" },
      { label: echo("name"), value: nft.nft_metadata?.name ?? "—" },
      { label: echo("description"), value: nft.nft_metadata?.description ?? "—" },
      {
        label: echo("series"),
        value: nft.series?.id ? (
          <Link href={`/series/${nft.series.id}`} className="link">
            {nft.series.name ?? nft.series.id}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("creator_address"),
        value: nft.creator_address ? (
          <Link href={`/address/${nft.creator_address}`} className="link">
            {nft.creator_address}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("creator_onchain_name"), value: nft.creator_onchain_name ?? "—" },
      {
        label: echo("symbol"),
        value: nft.symbol ? (
          <Link href={`/token/${nft.symbol}`} className="link">
            {nft.symbol}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("chain"), value: nft.chain ?? "—" },
      {
        label: echo("contract"),
        value: nft.contract?.hash ? (
          <Link href={`/contract/${nft.contract.hash}`} className="link">
            {nft.contract.name ?? nft.contract.hash}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("infused_into"),
        value: nft.infused_into?.token_id ? (
          <Link href={`/nft/${nft.infused_into.token_id}`} className="link">
            {nft.infused_into.token_id}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("mint_number"),
        value: nft.nft_metadata?.mint_number ?? "—",
      },
      {
        label: echo("mint_date"),
        value: nft.nft_metadata?.mint_date
          ? formatDateTime(unixToDate(nft.nft_metadata.mint_date))
          : "—",
      },
    ];
  }, [nft, echo]);

  const infusionMetadata = useMemo(() => {
    if (!nft?.infusion?.length) return undefined;
    const entries = nft.infusion.map((item, index) => {
      const key = item.key?.trim() || `Infusion ${index + 1}`;
      return [key, item.value ?? "—"] as const;
    });
    return Object.fromEntries(entries);
  }, [nft?.infusion]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="grid gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-end gap-4">
                {nft ? (
                  <ExportButton
                    data={[nft]}
                    filename={`PhantasmaExplorer-NFT-${tokenId}.csv`}
                    label={echo("table-exportCsv")}
                  />
                ) : null}
              </div>
              <div className="mt-4">
                {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                {error && <div className="text-sm text-destructive">Failed to load NFT.</div>}
                {nft ? <DetailList items={items} /> : null}
              </div>
            </div>
            {nft?.nft_metadata?.imageURL || nft?.nft_metadata?.videoURL ? (
              <div className="glass-panel rounded-2xl p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  {echo("media")}
                </div>
                <div className="mt-4">
                  {nft.nft_metadata?.videoURL ? (
                    <video
                      src={nft.nft_metadata.videoURL}
                      controls
                      className="w-full rounded-xl border border-border/60"
                    />
                  ) : nft.nft_metadata?.imageURL ? (
                    <img
                      src={nft.nft_metadata.imageURL}
                      alt={nft.nft_metadata?.name ?? "NFT"}
                      className="w-full rounded-xl border border-border/60"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
            <MetadataPanel title={echo("metadata-nft")} data={nft?.nft_metadata?.metadata} />
            <MetadataPanel title={echo("metadata-series")} data={nft?.series?.metadata} />
            <MetadataPanel title={echo("infusion")} data={infusionMetadata} />
          </div>
        ),
      },
      {
        id: "owners",
        label: echo("owners"),
        content: <NftOwnersTable owners={nft?.owners} />,
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: <RawJsonPanel data={nft} />,
      },
    ],
    [echo, error, items, loading, nft, tokenId],
  );

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("nft")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-all text-xl font-semibold">{tokenId}</h1>
        <CopyButton value={tokenId} />
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
