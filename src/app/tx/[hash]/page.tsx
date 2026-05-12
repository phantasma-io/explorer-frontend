"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { EventActivity } from "@/components/event-activity";
import { EventSummary } from "@/components/event-summary";
import { ExportButton } from "@/components/export-button";
import { NotFoundPanel } from "@/components/not-found-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { EventsTable } from "@/components/events-table";
import { ListSearch } from "@/components/list-search";
import { SectionTabs } from "@/components/section-tabs";
import { TagChip } from "@/components/tag-chip";
import { TxStateBadge } from "@/components/tx-state-badge";
import { ComboSelect } from "@/components/ui/combo-select";
import { endpoints } from "@/lib/api/endpoints";
import { isNotFoundError } from "@/lib/api/fetcher";
import { useApi } from "@/lib/hooks/use-api";
import { useEventKindOptions } from "@/lib/hooks/use-event-kind-options";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type {
  EventResults,
  RejectedTransactionCandidateResults,
  TransactionResults,
} from "@/lib/types/api";
import {
  formatDateTimeWithRelative,
  formatDateTimeWithSeconds,
  formatRelativeAge,
  unixToDate,
} from "@/lib/utils/time";
import { decodeBase16 } from "@/lib/utils/decode-base16";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { useEcho } from "@/lib/i18n/use-echo";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { ACTION_EVENT_KINDS, buildTransactionNarrative } from "@/lib/tx/transaction-narrative";

const parseStoredJson = (value?: string) => {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const renderCandidateAddress = (address?: string) =>
  address ? (
    <Link href={`/address/${address}`} className="link break-all">
      {address}
    </Link>
  ) : (
    "—"
  );

export default function TransactionPage() {
  const { echo } = useEcho();
  const router = useRouter();
  const { config } = useExplorerConfig();
  const hashParam = useRouteParam("hash");
  const txEndpoint = hashParam
    ? endpoints.transactions({
        hash: hashParam,
      })
    : null;
  const txNeighborsEndpoint = hashParam
    ? endpoints.transactions({
        hash: hashParam,
        with_neighbors: 1,
      })
    : null;
  const txPreviewEventsEndpoint = hashParam
    ? endpoints.events({
        transaction_hash: hashParam,
        chain: "",
        limit: 200,
        order_by: "date",
        order_direction: "desc",
        with_event_data: 1,
        with_fiat: 0,
      })
    : null;
  const txNarrativeEventsEndpoint = hashParam
    ? endpoints.events({
        transaction_hash: hashParam,
        chain: "",
        limit: 10000,
        order_by: "date",
        order_direction: "desc",
        with_event_data: 1,
        with_fiat: 0,
      })
    : null;
  const explorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, txEndpoint),
    [config.apiBaseUrl, txEndpoint],
  );
  const rpcUrl = useMemo(
    () =>
      hashParam
        ? buildRpcUrl(
            config.nexus,
            "GetTransaction",
            { hashText: hashParam },
            config.rpcBaseUrl,
          )
        : null,
    [config.nexus, config.rpcBaseUrl, hashParam],
  );
  const { data, loading, error } = useApi<TransactionResults>(txEndpoint);
  const { data: txNeighborsData } = useApi<TransactionResults>(txNeighborsEndpoint);
  const {
    data: txPreviewEventsData,
    loading: txPreviewEventsLoading,
    error: txPreviewEventsError,
  } = useApi<EventResults>(txPreviewEventsEndpoint);
  const { data: txNarrativeEventsData } = useApi<EventResults>(txNarrativeEventsEndpoint);
  const isNotFound = isNotFoundError(error);

  const tx = useMemo(() => {
    const baseTx = data?.transactions?.[0];
    if (!baseTx) return undefined;

    const neighborsTx = txNeighborsData?.transactions?.[0];
    if (!neighborsTx) return baseTx;

    return {
      ...baseTx,
      previous_hash: neighborsTx.previous_hash ?? baseTx.previous_hash,
      next_hash: neighborsTx.next_hash ?? baseTx.next_hash,
    };
  }, [data?.transactions, txNeighborsData?.transactions]);
  const shouldLoadRejectedCandidate = Boolean(
    hashParam && !loading && !tx && (!error || isNotFound),
  );
  const rejectedCandidateEndpoint = shouldLoadRejectedCandidate
    ? endpoints.rejectedTransactions({
        hash: hashParam,
        capture: 1,
      })
    : null;
  const rejectedCandidateExplorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, rejectedCandidateEndpoint),
    [config.apiBaseUrl, rejectedCandidateEndpoint],
  );
  const {
    data: rejectedCandidateData,
    loading: rejectedCandidateLoading,
  } = useApi<RejectedTransactionCandidateResults>(rejectedCandidateEndpoint);
  const rejectedCandidate = useMemo(
    () => rejectedCandidateData?.rejected_transactions?.[0],
    [rejectedCandidateData?.rejected_transactions],
  );
  const txPreviewEvents = useMemo(() => txPreviewEventsData?.events ?? [], [txPreviewEventsData?.events]);
  const txNarrativeEvents = useMemo(
    () => txNarrativeEventsData?.events ?? txPreviewEvents,
    [txNarrativeEventsData?.events, txPreviewEvents],
  );
  const hasTxPreviewEventsError = Boolean(txPreviewEventsError || txPreviewEventsData?.error);
  const [eventSearch, setEventSearch] = useState("");
  const [eventQuery, setEventQuery] = useState<string | undefined>(undefined);
  const [eventKind, setEventKind] = useState("");
  const { options: eventKindOptions } = useEventKindOptions(true);

  const narrative = useMemo(
    () => buildTransactionNarrative(tx, txNarrativeEvents, echo),
    [echo, tx, txNarrativeEvents],
  );

  const isFailedTx = useMemo(() => {
    const normalized = (tx?.state ?? "").trim().toLowerCase();
    return normalized === "break" || normalized === "fault" || normalized.includes("fail");
  }, [tx?.state]);

  const txTags = useMemo(() => {
    if (!tx || !narrative?.actions?.length) return [];
    const actions = narrative.actions;
    const events = txNarrativeEvents;

    const hasTokenCreate = actions.some((action) => action.kind === "TokenCreate");
    const hasSeriesCreate = actions.some((action) => action.kind === "TokenSeriesCreate");
    const hasMintNft = actions.some((action) => action.kind === "TokenMint" && action.isNft);
    const hasMintFungible = actions.some((action) => action.kind === "TokenMint" && !action.isNft);
    const hasSpecialResolution = actions.some((action) => action.kind === "SpecialResolution");
    const hasTrade = events.some((event) => event.event_kind === "OrderFilled");
    const hasStake = actions.some((action) => action.kind === "TokenStake");
    const hasTransfer = actions.some(
      (action) => action.kind === "TokenSend" || action.kind === "TokenReceive",
    );
    const nftTransfers = actions.filter(
      (action) =>
        action.isNft &&
        (action.kind === "TokenSend" || action.kind === "TokenReceive"),
    );
    const nftTransferCount = nftTransfers.reduce((total, action) => total + (action.count || 0), 0);
    const hasNftTransfer = nftTransferCount > 0;
    const hasFungibleTransfer = actions.some(
      (action) =>
        !action.isNft && (action.kind === "TokenSend" || action.kind === "TokenReceive"),
    );
    const hasKcalBurn = actions.some((action) => {
      if (action.kind !== "TokenBurn" || action.symbol !== "KCAL") return false;
      const numeric = Number((action.amount ?? "").replace(/,/g, ""));
      return Number.isFinite(numeric) && numeric >= 1;
    });

    // Order tags by importance to make scanning faster.
    const tags: { key: string; label: string; tone: string }[] = [];
    if (hasSpecialResolution)
      tags.push({ key: "sr", label: echo("tag_special_resolution"), tone: "sr" });
    if (hasTokenCreate) tags.push({ key: "deploy", label: echo("tag_deploy_token"), tone: "deploy" });
    if (hasSeriesCreate) tags.push({ key: "series", label: echo("tag_create_series"), tone: "series" });
    if (hasMintNft) tags.push({ key: "mint-nft", label: echo("tag_mint_nft"), tone: "mint" });
    if (hasMintFungible) tags.push({ key: "mint-fungible", label: echo("tag_mint_fungible"), tone: "mint" });
    if (hasTrade) tags.push({ key: "trade", label: echo("tag_trade"), tone: "trade" });
    if (hasStake) tags.push({ key: "stake", label: echo("tag_stake"), tone: "stake" });
    if (hasKcalBurn) tags.push({ key: "burn", label: echo("tag_burn"), tone: "burn" });
    if (hasTransfer) tags.push({ key: "transfer", label: echo("tag_transfer"), tone: "transfer" });
    if (hasNftTransfer)
      tags.push({
        key: "nft",
        label: nftTransferCount > 1 ? echo("nfts") : echo("nft"),
        tone: "nft",
      });
    if (hasFungibleTransfer)
      tags.push({ key: "fungible", label: echo("fungible"), tone: "fungible" });

    return tags;
  }, [echo, narrative?.actions, tx, txNarrativeEvents]);

  const renderActionLabel = useCallback((action: {
    kind: string;
    verb: string;
    amount: string;
    symbol: string;
    count: number;
    isNft: boolean;
    nftLabel?: string;
    nftId?: string;
    seriesLabel?: string;
    seriesId?: string;
    specialResolutionId?: string;
    tokenKind?: "fungible" | "nft";
    toAddress?: string;
  }) => {
    // Custom human-friendly phrasing for series/token creation and NFT minting.
    if (action.kind === "SpecialResolution") {
      return (
        <>
          {echo("special_resolution")}{" "}
          {action.specialResolutionId ? `#${action.specialResolutionId}` : "-"}
        </>
      );
    }

    if (action.kind === "TokenSeriesCreate") {
      return (
        <>
          {echo("created_series")}{" "}
          {action.seriesId ? (
            <Link href={`/series/${action.seriesId}`} className="link font-semibold">
              {action.seriesLabel ?? `#${action.seriesId}`}
            </Link>
          ) : (
            "-"
          )}{" "}
          {echo("for_token")}{" "}
          {action.symbol ? (
            <Link href={`/token/${action.symbol}`} className="link font-semibold">
              {action.symbol}
            </Link>
          ) : (
            "-"
          )}
        </>
      );
    }

    if (action.kind === "TokenCreate") {
      return (
        <>
          {echo("deployed")} {action.tokenKind === "nft" ? echo("nft_token") : echo("fungible_token")}{" "}
          {action.symbol ? (
            <Link href={`/token/${action.symbol}`} className="link font-semibold">
              {action.symbol}
            </Link>
          ) : (
            "-"
          )}
        </>
      );
    }

    if (action.kind === "TokenMint" && action.isNft) {
      return (
        <>
          {echo("minted")}{" "}
          {action.nftId ? (
            <Link href={`/nft/${action.nftId}`} className="link font-semibold">
              #{stringTruncateMiddle(action.nftId, 10, 6)}
            </Link>
          ) : (
            "-"
          )}{" "}
          {echo("for_token")}{" "}
          {action.symbol ? (
            <Link href={`/token/${action.symbol}`} className="link font-semibold">
              {action.symbol}
            </Link>
          ) : (
            "-"
          )}
        </>
      );
    }

    return (
      <>
        {action.verb ? `${action.verb} ` : ""}
        {action.isNft ? (
          <>
            {action.count > 1 ? `${action.count} ` : ""}
            {action.symbol ? (
              <Link href={`/token/${action.symbol}`} className="link font-semibold">
                {action.symbol}
              </Link>
            ) : (
              echo("nft")
            )}
            {action.symbol && action.count > 1 ? ` ${echo("nfts")}` : ""}
            {action.count === 1 && action.nftLabel ? (
              action.nftId ? (
                <>
                  {" "}
                  <Link href={`/nft/${action.nftId}`} className="link font-semibold">
                    {action.nftLabel}
                  </Link>
                </>
              ) : (
                ` ${action.nftLabel}`
              )
            ) : null}
            {action.kind === "TokenSend" && action.toAddress ? (
              <>
                {" "}{echo("to")}{" "}
                <Link href={`/address/${action.toAddress}`} className="link font-semibold break-all">
                  {action.toAddress}
                </Link>
              </>
            ) : null}
          </>
        ) : (
          <>
            {action.count > 1 ? `${action.count}x ` : ""}
            {action.amount && action.count === 1 ? `${action.amount} ` : ""}
            {action.symbol ? (
              <Link href={`/token/${action.symbol}`} className="link font-semibold">
                {action.symbol}
              </Link>
            ) : null}
          </>
        )}
      </>
    );
  }, [echo]);

  const timeLabel = useMemo(() => {
    if (!tx?.date) return null;
    const date = unixToDate(tx.date);
    return formatRelativeAge(date);
  }, [tx]);

  const blockHref = useCallback(
    (blockId?: string, chainOverride?: string | null) => {
      if (!blockId) return "/blocks";
      const normalizedChain = (chainOverride ?? tx?.chain ?? "").trim().toLowerCase();
      return normalizedChain && normalizedChain !== "main"
        ? `/block/${blockId}?chain=${encodeURIComponent(normalizedChain)}`
        : `/block/${blockId}`;
    },
    [tx?.chain],
  );

  const diagnosticsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!config.diagnostics?.enabled || !tx) return;
    const events = txNarrativeEvents;
    const actionEvents = events.filter((event) =>
      ACTION_EVENT_KINDS.has(event.event_kind ?? ""),
    );
    const sendEvents = actionEvents.filter((event) => event.event_kind === "TokenSend");
    const receiveEvents = actionEvents.filter((event) => event.event_kind === "TokenReceive");
    const key = `${tx.hash ?? "unknown"}:${events.length}:${actionEvents.length}`;
    if (diagnosticsKeyRef.current === key) return;
    diagnosticsKeyRef.current = key;
    const kindCounts = actionEvents.reduce<Record<string, number>>((acc, event) => {
      const kind = event.event_kind ?? "Unknown";
      acc[kind] = (acc[kind] ?? 0) + 1;
      return acc;
    }, {});
    console.warn("[pha-explorer][diag] tx-description", {
      hash: tx.hash,
      apiBaseUrl: config.apiBaseUrl,
      mode: narrative?.mode,
      initiatorAddress: narrative?.initiatorAddress,
      eventsTotal: events.length,
      actionEvents: actionEvents.length,
      sendEvents: sendEvents.length,
      receiveEvents: receiveEvents.length,
      actionKinds: kindCounts,
      actionsSummary: narrative?.actions?.map((action) => ({
        kind: action.kind,
        symbol: action.symbol,
        count: action.count,
        isNft: action.isNft,
        amount: action.amount,
      })),
      from: narrative?.from,
      to: narrative?.to,
      toCount: narrative?.toCount,
    });
  }, [config.apiBaseUrl, config.diagnostics?.enabled, narrative, tx, txNarrativeEvents]);

  const overviewItems = useMemo(() => {
    if (!tx) return [];
    return [
      { label: echo("state"), value: <TxStateBadge state={tx.state} /> },
      {
        label: echo("block_height"),
        value: tx.block_height ? (
          <Link href={blockHref(tx.block_height)} className="link">
            {tx.block_height}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("date"),
        value: tx.date ? formatDateTimeWithRelative(unixToDate(tx.date)) : "—",
      },
      { label: echo("fee"), value: tx.fee ? `${tx.fee} KCAL` : "—" },
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
        label: echo("gas_payer"),
        value: tx.gas_payer?.address ? (
          <Link href={`/address/${tx.gas_payer.address}`} className="link">
            {tx.gas_payer.address}
          </Link>
        ) : (
          "—"
        ),
      },
    ];
  }, [tx, echo, blockHref]);

  const advancedItems = useMemo(() => {
    if (!tx) return [];
    const expiration =
      tx.expiration && tx.expiration !== "0"
        ? formatDateTimeWithSeconds(unixToDate(tx.expiration))
        : "—";
    return [
      { label: echo("hash"), value: tx.hash ?? "—" },
      {
        label: echo("block_hash"),
        value: tx.block_hash ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link href={blockHref(tx.block_hash)} className="link">
              {tx.block_hash}
            </Link>
            <CopyButton value={tx.block_hash} />
          </div>
        ) : (
          "—"
        ),
      },
      { label: echo("index"), value: tx.index ?? "—" },
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
      { label: echo("gas_limit"), value: tx.gas_limit ? `${tx.gas_limit} KCAL` : echo("unlimited") },
      { label: echo("gas_price"), value: tx.gas_price ?? "—" },
      { label: echo("expiration"), value: expiration },
      {
        label: echo("result"),
        value: tx.result ? <span className="break-all">{tx.result}</span> : "—",
      },
      {
        label: echo("debug_comment"),
        value: tx.debug_comment ? (
          <span className="break-words whitespace-pre-wrap">{tx.debug_comment}</span>
        ) : (
          "—"
        ),
      },
      {
        label: echo("payload"),
        value: tx.payload ? (
          <span className="break-all font-mono text-xs">{decodeBase16(tx.payload)}</span>
        ) : (
          "—"
        ),
      },
    ];
  }, [tx, echo, blockHref]);

  const rejectedCandidateOverviewItems = useMemo(() => {
    if (!rejectedCandidate) return [];
    return [
      { label: echo("state"), value: <TxStateBadge state={rejectedCandidate.state} /> },
      { label: echo("canonical_status"), value: rejectedCandidate.canonical_status ?? "—" },
      {
        label: echo("block_height"),
        value: rejectedCandidate.block_height ? (
          <Link
            href={blockHref(rejectedCandidate.block_height, rejectedCandidate.chain)}
            className="link"
          >
            {rejectedCandidate.block_height}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("date"),
        value: rejectedCandidate.date
          ? formatDateTimeWithRelative(unixToDate(rejectedCandidate.date))
          : "—",
      },
      {
        label: echo("debug_comment"),
        value: rejectedCandidate.debug_comment ? (
          <span className="break-words whitespace-pre-wrap">
            {rejectedCandidate.debug_comment}
          </span>
        ) : (
          "—"
        ),
      },
      {
        label: echo("result"),
        value: rejectedCandidate.result ? (
          <span className="break-all">{rejectedCandidate.result}</span>
        ) : (
          "—"
        ),
      },
      {
        label: echo("captured_at"),
        value: rejectedCandidate.captured_at
          ? formatDateTimeWithRelative(unixToDate(rejectedCandidate.captured_at))
          : "—",
      },
    ];
  }, [blockHref, echo, rejectedCandidate]);

  const rejectedCandidateAdvancedItems = useMemo(() => {
    if (!rejectedCandidate) return [];
    const expiration =
      rejectedCandidate.expiration && rejectedCandidate.expiration !== "0"
        ? formatDateTimeWithSeconds(unixToDate(rejectedCandidate.expiration))
        : "—";
    return [
      { label: echo("hash"), value: rejectedCandidate.hash ?? "—" },
      { label: echo("nexus"), value: rejectedCandidate.nexus ?? "—" },
      { label: echo("chain"), value: rejectedCandidate.chain ?? "—" },
      {
        label: echo("block_hash"),
        value: rejectedCandidate.block_hash ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={blockHref(rejectedCandidate.block_hash, rejectedCandidate.chain)}
              className="link break-all"
            >
              {rejectedCandidate.block_hash}
            </Link>
            <CopyButton value={rejectedCandidate.block_hash} />
          </div>
        ) : (
          "—"
        ),
      },
      { label: echo("sender"), value: renderCandidateAddress(rejectedCandidate.sender) },
      { label: echo("gas_payer"), value: renderCandidateAddress(rejectedCandidate.gas_payer) },
      { label: echo("gas_target"), value: renderCandidateAddress(rejectedCandidate.gas_target) },
      { label: echo("fee"), value: rejectedCandidate.fee_raw ?? "—" },
      { label: echo("gas_limit"), value: rejectedCandidate.gas_limit_raw ?? "—" },
      { label: echo("gas_price"), value: rejectedCandidate.gas_price_raw ?? "—" },
      { label: echo("expiration"), value: expiration },
      {
        label: echo("payload"),
        value: rejectedCandidate.payload ? (
          <span className="break-all font-mono text-xs">
            {decodeBase16(rejectedCandidate.payload)}
          </span>
        ) : (
          "—"
        ),
      },
      {
        label: echo("script"),
        value: rejectedCandidate.script_raw ? (
          <span className="break-all font-mono text-xs">{rejectedCandidate.script_raw}</span>
        ) : (
          "—"
        ),
      },
      {
        label: echo("updated_at"),
        value: rejectedCandidate.updated_at
          ? formatDateTimeWithRelative(unixToDate(rejectedCandidate.updated_at))
          : "—",
      },
    ];
  }, [blockHref, echo, rejectedCandidate]);

  const rejectedCandidateRawData = useMemo(() => {
    if (!rejectedCandidate) return undefined;
    return {
      ...rejectedCandidate,
      rpc_response: parseStoredJson(rejectedCandidate.rpc_response_json),
      block_response: parseStoredJson(rejectedCandidate.block_response_json),
    };
  }, [rejectedCandidate]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="grid gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div
                className={`flex flex-wrap items-center gap-4 ${
                  txTags.length ? "justify-between" : "justify-end"
                }`}
              >
                {txTags.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {txTags.map((tag) => (
                      <TagChip
                        key={tag.key}
                        label={tag.label}
                        tone={tag.tone as Parameters<typeof TagChip>[0]["tone"]}
                      />
                    ))}
                  </div>
                ) : null}
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
                      aria-label={echo("previous_transaction")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => tx?.next_hash && router.push(`/tx/${tx.next_hash}`)}
                      disabled={!tx?.next_hash}
                      aria-label={echo("next_transaction")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              {tx ? (
                <div className="mt-4 rounded-2xl border border-border/70 bg-muted/20 px-5 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                    {echo("desc")}
                  </div>
                <div className="mt-2 text-base font-semibold text-foreground">
                  {narrative?.actions?.length ? (
                    <span className="flex flex-wrap items-center gap-2">
                      {narrative.actions.map((action, index) => (
                        <span key={`${action.kind}-${action.amount}-${action.symbol}-${index}`}>
                          {renderActionLabel(action)}
                          {index < narrative.actions.length - 1 ? (
                            <span className="text-muted-foreground"> · </span>
                          ) : null}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <>
                      {isFailedTx ? (
                        <span>
                          <span className="text-rose-500">{echo("failed_transaction")}</span>
                        </span>
                      ) : (
                        narrative?.headline ?? echo("transaction")
                      )}
                    </>
                  )}
                </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {narrative?.from ? (
                      <>
                        <span>{echo("from")}</span>
                        <Link href={`/address/${narrative.from}`} className="break-all font-medium link">
                          {narrative.from}
                        </Link>
                      </>
                    ) : null}
                    {narrative?.to ? (
                      <>
                        <span>{echo("to")}</span>
                        <Link href={`/address/${narrative.to}`} className="break-all font-medium link">
                          {narrative.to}
                        </Link>
                      </>
                  ) : narrative?.toCount &&
                    narrative.toCount > 1 &&
                    !narrative.hasRecipientBreakdown ? (
                    <span>
                      {echo("to")} {narrative.toCount} {echo("recipients")}
                    </span>
                  ) : null}
                  </div>
                  {timeLabel ? (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{timeLabel}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4">
                {loading && <div className="text-sm text-muted-foreground">{echo("loading")}</div>}
                {error && <div className="text-sm text-destructive">{echo("failed_to_load_transaction")}</div>}
                {tx ? <DetailList items={overviewItems} /> : null}
              </div>
            </div>
            {txPreviewEventsLoading ? (
              <div className="text-sm text-muted-foreground">{echo("loading_events")}</div>
            ) : hasTxPreviewEventsError ? (
              <div className="text-sm text-destructive">{echo("failed_to_load_events_preview")}</div>
            ) : txPreviewEvents.length ? (
              <EventSummary events={txPreviewEvents} />
            ) : (
              <div className="text-sm text-muted-foreground">{echo("no_events_in_transaction")}</div>
            )}
          </div>
        ),
      },
      {
        id: "advanced",
        label: echo("tab-advanced"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <div className="mt-4">{tx ? <DetailList items={advancedItems} /> : null}</div>
          </div>
        ),
      },
      {
        id: "activity",
        label: echo("activity"),
        content: txPreviewEventsLoading ? (
          <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
            {echo("loading_events")}
          </div>
        ) : hasTxPreviewEventsError ? (
          <div className="glass-panel rounded-2xl p-6 text-sm text-destructive">
            {echo("failed_to_load_events_preview")}
          </div>
        ) : txPreviewEvents.length ? (
          <EventActivity events={txPreviewEvents} />
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
            {echo("no_events_in_transaction")}
          </div>
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
            transactionHash={hashParam || undefined}
            chain=""
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
        content: <RawJsonPanel data={tx} rpcUrl={rpcUrl} explorerUrl={explorerUrl} />,
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
      isFailedTx,
      loading,
      explorerUrl,
      rpcUrl,
      overviewItems,
      narrative,
      renderActionLabel,
      router,
      timeLabel,
      tx,
      hasTxPreviewEventsError,
      txPreviewEventsLoading,
      txPreviewEvents,
      txTags,
    ],
  );

  const rejectedCandidateTabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-3">
              <TxStateBadge state={rejectedCandidate?.state} />
              <span className="rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">
                {echo("rejected_transaction_candidate")}
              </span>
            </div>
            <div className="mt-4 rounded-2xl border border-border/70 bg-muted/20 px-5 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                {echo("desc")}
              </div>
              <div className="mt-2 text-base font-semibold text-foreground">
                {echo("rejected_transaction_candidate_desc")}
              </div>
            </div>
            <div className="mt-4">
              <DetailList items={rejectedCandidateOverviewItems} />
            </div>
          </div>
        ),
      },
      {
        id: "advanced",
        label: echo("tab-advanced"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <DetailList items={rejectedCandidateAdvancedItems} />
          </div>
        ),
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: (
          <RawJsonPanel
            data={rejectedCandidateRawData}
            rpcUrl={rpcUrl}
            explorerUrl={rejectedCandidateExplorerUrl}
          />
        ),
      },
    ],
    [
      echo,
      rejectedCandidate?.state,
      rejectedCandidateAdvancedItems,
      rejectedCandidateExplorerUrl,
      rejectedCandidateOverviewItems,
      rejectedCandidateRawData,
      rpcUrl,
    ],
  );

  const rejectedCandidateHeader = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("rejected_transaction_candidate")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-all text-xl font-semibold">{hashParam}</h1>
        <CopyButton value={hashParam} />
      </div>
    </div>
  );

  if (!tx && rejectedCandidate) {
    return (
      <AppShell>
        <div className="grid gap-8">
          <SectionTabs tabs={rejectedCandidateTabs} header={rejectedCandidateHeader} />
        </div>
      </AppShell>
    );
  }

  if (!tx && shouldLoadRejectedCandidate && rejectedCandidateLoading) {
    return (
      <AppShell>
        <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
          {echo("loading")}
        </div>
      </AppShell>
    );
  }

  if (isNotFound || (!loading && !error && !tx)) {
    return (
      <AppShell>
        <NotFoundPanel description={echo("not_found_transaction")} />
      </AppShell>
    );
  }

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
