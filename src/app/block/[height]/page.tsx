"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { EventsTable } from "@/components/events-table";
import { NotFoundPanel } from "@/components/not-found-panel";
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
import type { BlockResults } from "@/lib/types/api";
import { formatDateTimeWithRelative, unixToDate } from "@/lib/utils/time";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { useEcho } from "@/lib/i18n/use-echo";

export default function BlockPage() {
  const { echo } = useEcho();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { config } = useExplorerConfig();
  const heightParam = useRouteParam("height");
  const chainParam = (searchParams?.get("chain") ?? "").trim().toLowerCase() || "main";
  const withChainQuery = useCallback(
    (blockId: string | number) =>
      chainParam === "main"
        ? `/block/${blockId}`
        : `/block/${blockId}?chain=${encodeURIComponent(chainParam)}`,
    [chainParam],
  );
  const blockEndpoint = heightParam
    ? endpoints.blocks({
        id: heightParam,
        chain: chainParam,
        with_fiat: 1,
        with_events: 1,
        with_event_data: 1,
        with_nft: 1,
      })
    : null;
  const explorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, blockEndpoint),
    [config.apiBaseUrl, blockEndpoint],
  );
  const rpcUrl = useMemo(
    () =>
      heightParam
        ? buildRpcUrl(
            config.nexus,
            "GetBlockByHeight",
            {
              chainInput: chainParam,
              height: heightParam,
            },
            config.rpcBaseUrl,
          )
        : null,
    [chainParam, config.nexus, config.rpcBaseUrl, heightParam],
  );
  const { data, loading, error } = useApi<BlockResults>(blockEndpoint);
  const isNotFound = isNotFoundError(error);
  const { data: latestBlockData } = useApi<BlockResults>(
    endpoints.blocks({ limit: 1, order_direction: "desc", chain: chainParam }),
  );

  const block = data?.blocks?.[0];
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionQuery, setTransactionQuery] = useState<string | undefined>(undefined);
  const [eventSearch, setEventSearch] = useState("");
  const [eventQuery, setEventQuery] = useState<string | undefined>(undefined);
  const [eventKind, setEventKind] = useState("");
  const { options: eventKindOptions } = useEventKindOptions(true);

  const items = useMemo(() => {
    if (!block) return [];
    return [
      { label: echo("height"), value: block.height },
      {
        label: echo("hash"),
        value: block.hash ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-all">{block.hash}</span>
            <CopyButton value={block.hash} />
          </div>
        ) : (
          "—"
        ),
      },
      {
        label: echo("prevHash"),
        value: block.previous_hash ? (
          <Link href={withChainQuery(block.previous_hash)} className="link">
            {block.previous_hash}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("date"),
        value: block.date ? formatDateTimeWithRelative(unixToDate(block.date)) : "—",
      },
      {
        label: echo("validatorAddress"),
        value: block.validator_address ? (
          <Link href={`/address/${block.validator_address}`} className="link">
            {block.validator_address}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("chainAddress"),
        value: block.chain_address ? (
          <Link href={`/address/${block.chain_address}`} className="link">
            {block.chain_address}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("protocol"), value: block.protocol ?? "—" },
    ];
  }, [block, echo, withChainQuery]);

  const blockHeight = useMemo(() => {
    const parsed = block?.height ? Number(block.height) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [block?.height]);
  const latestBlockHeight = useMemo(() => {
    const latest = latestBlockData?.blocks?.[0]?.height;
    const parsed = latest ? Number(latest) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [latestBlockData?.blocks]);
  const canGoNext = blockHeight !== null && latestBlockHeight !== null && blockHeight < latestBlockHeight;

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {block ? (
                  <ExportButton
                    data={[block]}
                    filename={`PhantasmaExplorer-Block-${heightParam}.csv`}
                    label={echo("table-exportCsv")}
                  />
                ) : null}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    onClick={() => {
                      if (blockHeight && blockHeight > 1) {
                        router.push(withChainQuery(blockHeight - 1));
                      }
                    }}
                    disabled={!blockHeight || blockHeight <= 1}
                    aria-label="Previous block"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    onClick={() => {
                      if (canGoNext) {
                        router.push(withChainQuery(blockHeight + 1));
                      }
                    }}
                    // Prevent navigating past the latest block (would 404 and trap the user).
                    disabled={!canGoNext}
                    aria-label="Next block"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {error && <div className="text-sm text-destructive">Failed to load block.</div>}
              {block ? <DetailList items={items} /> : null}
            </div>
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
            blockHeight={heightParam || undefined}
            chain={chainParam}
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
            blockHeight={heightParam || undefined}
            chain={chainParam}
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
        content: <RawJsonPanel data={block} rpcUrl={rpcUrl} explorerUrl={explorerUrl} />,
      },
    ],
    [
      block,
      echo,
      error,
      eventKind,
      eventKindOptions,
      eventQuery,
      eventSearch,
      explorerUrl,
      heightParam,
      items,
      loading,
      rpcUrl,
      canGoNext,
      blockHeight,
      chainParam,
      router,
      transactionQuery,
      transactionSearch,
      withChainQuery,
    ],
  );

  if (isNotFound || (!loading && !error && !block)) {
    return (
      <AppShell>
        <NotFoundPanel description="Block was not found." />
      </AppShell>
    );
  }

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("block")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">#{heightParam}</h1>
        <CopyButton value={heightParam} />
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
