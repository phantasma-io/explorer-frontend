"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { ExportButton } from "@/components/export-button";
import { MetadataPanel } from "@/components/metadata-panel";
import { NotFoundPanel } from "@/components/not-found-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { NftResults } from "@/lib/types/api";
import { stringTruncate, stringTruncateMiddle } from "@/lib/utils/format";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { useEcho } from "@/lib/i18n/use-echo";

const normalizeWikiImageUrl = (value?: string | null) => {
  if (!value) return null;
  if (!value.includes("wikipedia.org/wiki/") || !value.includes("File:")) {
    return value;
  }
  const marker = "File:";
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return value;
  const fileName = value.slice(markerIndex + marker.length);
  if (!fileName) return value;
  try {
    const parsed = new URL(value);
    return `${parsed.origin}/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
  } catch {
    return value;
  }
};

export default function NftPage() {
  const { echo } = useEcho();
  const textLimit = 100;
  const compactLimit = 40;
  const tokenId = useRouteParam("id");
  const nftEndpoint = tokenId
    ? endpoints.nfts({ token_id: tokenId, with_logo: 1, with_price: 1 })
    : null;
  const { data, loading, error } = useApi<NftResults>(nftEndpoint);

  const nft = data?.nfts?.[0];

  const truncateText = (value?: string | null) => {
    if (!value) return null;
    const limit = /\s/.test(value) ? textLimit : compactLimit;
    return value.length > limit ? stringTruncate(value, limit) : value;
  };

  const renderText = (value?: string | null) => {
    if (!value) return null;
    const display = truncateText(value);
    if (!display) return null;
    const title = value.length > textLimit ? value : undefined;
    return <span title={title}>{display}</span>;
  };

  const renderExternalLink = (href?: string | null) => {
    if (!href) return null;
    const display = truncateText(href) ?? href;
    const title = href.length > textLimit ? href : undefined;
    return (
      <a href={href} target="_blank" rel="noreferrer" className="link" title={title}>
        {display}
      </a>
    );
  };

  const renderCopyableText = (value?: string | null) => {
    if (!value) return null;
    const display = truncateText(value) ?? value;
    const title = value.length > textLimit ? value : undefined;
    return (
      <span className="inline-flex items-center gap-2">
        <span className="break-all" title={title}>
          {display}
        </span>
        <CopyButton value={value} />
      </span>
    );
  };

  const ownerAddress = nft?.owners?.[0]?.address ?? null;
  const mediaImageUrl = useMemo(() => {
    if (!nft) return null;
    const metadata = nft.nft_metadata?.metadata ?? {};
    const raw =
      nft.nft_metadata?.imageURL ??
      (nft.nft_metadata as { image_url?: string } | undefined)?.image_url ??
      metadata["imageURL"] ??
      metadata["imageUrl"] ??
      metadata["image_url"] ??
      metadata["ImageURL"] ??
      metadata["image"] ??
      metadata["Image"] ??
      nft.series?.image ??
      null;
    return normalizeWikiImageUrl(raw);
  }, [nft]);
  const details = useMemo(() => {
    if (!nft) return [];
    const entries: Array<{ label: string; value: ReactNode }> = [];
    const addEntry = (label: string, value: ReactNode) => {
      if (value === null || value === undefined || value === "") return;
      entries.push({ label, value });
    };

    addEntry(
      echo("series"),
      nft.series?.id ? (
        <Link href={`/series/${nft.series.id}`} className="link">
          {nft.series.name ?? nft.series.id}
        </Link>
      ) : null,
    );
    addEntry(
      echo("owner"),
      ownerAddress ? (
        <Link href={`/address/${ownerAddress}`} className="link" title={ownerAddress}>
          {stringTruncateMiddle(ownerAddress, 8, 6)}
        </Link>
      ) : null,
    );
    addEntry(
      echo("creator"),
      nft.creator_address ? (
        <Link href={`/address/${nft.creator_address}`} className="link">
          {renderText(nft.creator_address)}
        </Link>
      ) : null,
    );
    addEntry(echo("creator_onchain_name"), renderText(nft.creator_onchain_name));
    addEntry(
      echo("contract"),
      nft.contract?.hash ? (
        <Link href={`/contract/${nft.contract.hash}`} className="link">
          {renderText(nft.contract.name ?? nft.contract.hash)}
        </Link>
      ) : null,
    );
    addEntry(
      echo("symbol"),
      nft.symbol ? (
        <Link href={`/token/${nft.symbol}`} className="link">
          {renderText(nft.symbol)}
        </Link>
      ) : null,
    );
    addEntry(echo("chain"), renderText(nft.chain ?? null));
    addEntry(
      echo("infused_into"),
      nft.infused_into?.token_id ? (
        <Link href={`/nft/${nft.infused_into.token_id}`} className="link">
          {renderText(nft.infused_into.token_id)}
        </Link>
      ) : null,
    );
    addEntry(echo("mint_number"), renderText(nft.nft_metadata?.mint_number ?? null));
    addEntry(
      echo("mint_date"),
      nft.nft_metadata?.mint_date
        ? formatDateTime(unixToDate(nft.nft_metadata.mint_date))
        : null,
    );

    return entries;
  }, [echo, nft, ownerAddress, renderExternalLink, renderCopyableText, renderText]);

  const attributes = useMemo(() => {
    if (!nft?.nft_metadata?.metadata) return [];
    return Object.entries(nft.nft_metadata.metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        const raw = String(value);
        const keyNormalized = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        // Normalize attribute keys so ROM / ImageURL are handled consistently across metadata variants.
        if (keyNormalized === "rom") {
          return {
            key,
            render: renderCopyableText(raw),
          };
        }
        if (keyNormalized === "imageurl") {
          return {
            key,
            render: renderExternalLink(raw),
          };
        }
        if (keyNormalized === "infourl") {
          return {
            key,
            render: renderExternalLink(raw),
          };
        }
        const display = truncateText(raw) ?? raw;
        const title = raw.length > textLimit ? raw : undefined;
        return {
          key,
          render: <span title={title}>{display}</span>,
        };
      });
  }, [nft?.nft_metadata?.metadata, renderCopyableText, renderExternalLink, textLimit]);


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
            <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
              <div className="glass-panel rounded-2xl p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  {echo("media")}
                </div>
                <div className="mt-4 flex justify-center">
                  <div
                    className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-border/60 bg-card/70"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    {nft?.nft_metadata?.videoURL ? (
                      <video
                        src={nft.nft_metadata.videoURL}
                        controls
                        className="h-full w-full object-contain"
                      />
                    ) : mediaImageUrl ? (
                      <img
                        src={mediaImageUrl}
                        alt={nft?.nft_metadata?.name ?? "NFT"}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        {echo("no-results")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-6">
                <div className="glass-panel rounded-2xl p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                        {echo("nft")}
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold">
                        {nft?.nft_metadata?.name ?? tokenId ?? "—"}
                      </h2>
                      {tokenId ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {echo("token_id")} {tokenId}
                          </span>
                          <CopyButton value={tokenId} />
                        </div>
                      ) : null}
                    </div>
                    {nft ? (
                      <ExportButton
                        data={[nft]}
                        filename={`PhantasmaExplorer-NFT-${tokenId}.csv`}
                        label={echo("table-exportCsv")}
                      />
                    ) : null}
                  </div>
                  {nft?.nft_metadata?.description ? (
                    <p
                      className="mt-4 text-sm text-muted-foreground"
                      title={
                        nft.nft_metadata.description.length > textLimit
                          ? nft.nft_metadata.description
                          : undefined
                      }
                    >
                      {truncateText(nft.nft_metadata.description)}
                    </p>
                  ) : null}
                  {details.length ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {details.map((entry) => (
                        <div
                          key={entry.label}
                          className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm"
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {entry.label}
                          </div>
                          <div className="mt-1 text-foreground">{entry.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {loading && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}
                  {error && <div className="mt-4 text-sm text-destructive">Failed to load NFT.</div>}
                </div>
              </div>
            </div>
            {attributes.length ? (
              <div className="glass-panel rounded-2xl p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  {echo("attributes")}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {attributes.map((attribute) => (
                  <div
                    key={attribute.key}
                    className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {attribute.key}
                    </div>
                    <div className="mt-1 text-foreground">
                      {attribute.render}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
            <div className="grid gap-6 lg:grid-cols-2">
              <MetadataPanel
                title={echo("metadata-series")}
                data={nft?.series?.metadata}
                maxValueLength={textLimit}
                singleLineMaxLength={compactLimit}
              />
              <MetadataPanel
                title={echo("infusion")}
                data={infusionMetadata}
                maxValueLength={textLimit}
                singleLineMaxLength={compactLimit}
              />
            </div>
          </div>
        ),
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: <RawJsonPanel data={nft} />,
      },
    ],
    [attributes, details, echo, error, infusionMetadata, loading, nft, tokenId],
  );

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("nft")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-all text-xl font-semibold">
          {nft?.nft_metadata?.name ?? tokenId ?? "—"}
        </h1>
      </div>
      {tokenId ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {echo("token_id")} {tokenId}
          </span>
          <CopyButton value={tokenId} />
        </div>
      ) : null}
    </div>
  );

  if (!loading && !error && !nft) {
    return (
      <AppShell>
        <NotFoundPanel description="NFT was not found." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-8">
        <SectionTabs tabs={tabs} header={header} />
      </div>
    </AppShell>
  );
}
