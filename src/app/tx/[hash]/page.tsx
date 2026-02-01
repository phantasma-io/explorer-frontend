"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type { TransactionResults } from "@/lib/types/api";
import {
  formatDateTimeWithRelative,
  formatDateTimeWithSeconds,
  formatRelativeAge,
  unixToDate,
} from "@/lib/utils/time";
import { decodeBase16 } from "@/lib/utils/decode-base16";
import { formatNumberString, stringTruncateMiddle } from "@/lib/utils/format";
import { getEventHeadline } from "@/lib/utils/event-text";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { useEcho } from "@/lib/i18n/use-echo";
import type { EventResult } from "@/lib/types/api";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";

const ACTION_EVENT_KINDS = new Set([
  "TokenSend",
  "TokenReceive",
  "TokenStake",
  "TokenUnstake",
  "TokenClaim",
  "TokenBurn",
  "TokenMint",
  "TokenCreate",
  "TokenSeriesCreate",
  "SpecialResolution",
]);

const NOISE_EVENT_KINDS = new Set(["GasEscrow", "GasPayment"]);

const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
};

const resolveIsNft = (event: EventResult): boolean => {
  const fungible = normalizeBoolean(event.token_event?.token?.fungible);
  if (fungible === true) return false;
  if (fungible === false) return true;

  if (event.token_create_event?.is_non_fungible !== undefined) {
    return Boolean(event.token_create_event?.is_non_fungible);
  }

  if (event.nft_metadata) return true;

  // token_id can appear on fungible token events, so only use it when token metadata is missing.
  return !event.token_event?.token && Boolean(event.token_id);
};

const getEventSymbol = (event: EventResult): string =>
  event.token_event?.token?.symbol ??
  event.token_create_event?.token?.symbol ??
  event.token_series_event?.token?.symbol ??
  "";

const getEventAmount = (event: EventResult): string =>
  String(event.token_event?.value ?? event.token_event?.value_raw ?? "");

const getNftInfo = (event: EventResult): { label?: string; tokenId?: string } => {
  const tokenId =
    event.token_id ?? event.token_event?.value ?? event.token_event?.value_raw ?? undefined;
  if (event.nft_metadata?.name) {
    return { label: event.nft_metadata.name, tokenId };
  }
  if (tokenId) {
    return { label: `#${stringTruncateMiddle(tokenId, 10, 6)}`, tokenId };
  }
  return {};
};

const getSeriesInfo = (event: EventResult): { label?: string; seriesId?: string } => {
  const seriesId =
    event.token_series_event?.series_id ??
    event.token_series_event?.carbon_series_id ??
    event.series?.id;
  if (seriesId) {
    return { label: `#${stringTruncateMiddle(seriesId, 10, 6)}`, seriesId };
  }
  return {};
};

const isNumericString = (value: string) => /^-?\d+(\.\d+)?$/.test(value);

// String-based addition keeps large decimal sums accurate without BigInt or float precision loss.
const sumDecimalStrings = (values: string[]): string | null => {
  if (!values.length) return null;
  if (!values.every((value) => isNumericString(value))) return null;

  // Use BigInt now that TS target is ES2022 to avoid floating precision loss.
  const fractionalLengths = values.map((value) => value.split(".")[1]?.length ?? 0);
  const maxFractional = Math.max(...fractionalLengths, 0);
  let total = 0n;

  values.forEach((raw) => {
    const negative = raw.startsWith("-");
    const [rawInt, rawFrac = ""] = (negative ? raw.slice(1) : raw).split(".");
    const scaledString = `${rawInt}${rawFrac.padEnd(maxFractional, "0")}`.replace(
      /^0+(?=\d)/,
      "",
    );
    const scaled = BigInt(scaledString || "0");
    total += negative ? -scaled : scaled;
  });

  const negative = total < 0n;
  let scaled = negative ? -total : total;
  let scaledStr = scaled.toString();

  if (maxFractional > 0) {
    scaledStr = scaledStr.padStart(maxFractional + 1, "0");
  }

  const intPart = maxFractional > 0 ? scaledStr.slice(0, -maxFractional) : scaledStr;
  const fracPart = maxFractional > 0 ? scaledStr.slice(-maxFractional).replace(/0+$/, "") : "";
  const normalizedInt = intPart || "0";
  const result = fracPart ? `${normalizedInt}.${fracPart}` : normalizedInt;

  return negative ? `-${result}` : result;
};

const getEventKey = (event: EventResult, isNft: boolean): string => {
  const symbol = getEventSymbol(event);
  if (isNft) {
    const tokenId =
      event.token_id ?? event.token_event?.value ?? event.token_event?.value_raw ?? "";
    return `${symbol}:${tokenId}`;
  }
  const amount = event.token_event?.value ?? event.token_event?.value_raw ?? "";
  return `${symbol}:${amount}`;
};

export default function TransactionPage() {
  const { echo } = useEcho();
  const router = useRouter();
  const { config } = useExplorerConfig();
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
  const isNotFound = isNotFoundError(error);

  const tx = data?.transactions?.[0];
  const [eventSearch, setEventSearch] = useState("");
  const [eventQuery, setEventQuery] = useState<string | undefined>(undefined);
  const [eventKind, setEventKind] = useState("");
  const { options: eventKindOptions } = useEventKindOptions(true);

  const narrative = useMemo(() => {
    if (!tx) return null;
    const events = tx.events ?? [];
    const nonNoiseEvents = events.filter(
      (event) => !NOISE_EVENT_KINDS.has(event.event_kind ?? ""),
    );
    const actionEvents = nonNoiseEvents.filter((event) =>
      ACTION_EVENT_KINDS.has(event.event_kind ?? ""),
    );
    const primaryEvent = nonNoiseEvents[0] ?? events[0];

    const sendEvents = actionEvents.filter((event) => event.event_kind === "TokenSend");
    const receiveEvents = actionEvents.filter((event) => event.event_kind === "TokenReceive");
    const sendKeys = new Set(
      sendEvents
        .map((event) => getEventKey(event, resolveIsNft(event)))
        .filter((key): key is string => Boolean(key)),
    );
    const receiveKeys = new Set(
      receiveEvents
        .map((event) => getEventKey(event, resolveIsNft(event)))
        .filter((key): key is string => Boolean(key)),
    );

    // Summarize all meaningful actions so multi-operation transactions are described correctly.
    // For NFTs, prefer TokenReceive to keep recipient breakdown; for fungibles, prefer TokenSend.
    const filteredEvents = actionEvents.filter((event) => {
      if (!event.event_kind) return false;
      if (event.event_kind === "TokenReceive") {
        const isNft = resolveIsNft(event);
        if (!isNft && sendKeys.size) {
          const key = getEventKey(event, false);
          return !key || !sendKeys.has(key);
        }
        return true;
      }
      if (event.event_kind === "TokenSend") {
        const isNft = resolveIsNft(event);
        if (isNft && receiveKeys.size) {
          const key = getEventKey(event, true);
          return !key || !receiveKeys.has(key);
        }
      }
      return true;
    });

    const actionGroups = filteredEvents.reduce<
      Map<
        string,
        {
          kind: string;
          verb: string;
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
          amounts: string[];
          order: number;
        }
      >
    >((acc, event, index) => {
      if (!event.event_kind) return acc;
      if (event.event_kind === "SpecialResolution") {
        const resolutionId =
          event.special_resolution_event?.resolution_id ?? event.event_id;
        const resolutionIdText =
          resolutionId !== undefined && resolutionId !== null ? String(resolutionId) : undefined;
        const groupKey = `SpecialResolution:${resolutionIdText ?? "unknown"}`;
        const existing = acc.get(groupKey);
        if (existing) {
          existing.count += 1;
          existing.order = Math.min(existing.order, index);
          return acc;
        }
        acc.set(groupKey, {
          kind: "SpecialResolution",
          verb: "",
          symbol: "",
          count: 1,
          isNft: false,
          amounts: [],
          order: index,
          specialResolutionId: resolutionIdText,
        });
        return acc;
      }
      const isSeriesCreate = event.event_kind === "TokenSeriesCreate";
      const isTokenCreate = event.event_kind === "TokenCreate";
      const isMint = event.event_kind === "TokenMint";
      const isReceive = event.event_kind === "TokenReceive";
      const isNft = isSeriesCreate ? false : resolveIsNft(event);
      const symbol = getEventSymbol(event);
      const amount = getEventAmount(event);
      const nftInfo = isNft ? getNftInfo(event) : {};
      const seriesInfo = isSeriesCreate ? getSeriesInfo(event) : {};
      const tokenKind =
        isTokenCreate && event.token_create_event
          ? event.token_create_event.is_non_fungible
            ? "nft"
            : "fungible"
          : undefined;

      if (event.event_kind === "TokenBurn" && symbol === "KCAL") {
        const parsed = parseFloat(amount);
        if (Number.isFinite(parsed) && parsed < 1) {
          return acc;
        }
      }

      const resolvedKind = isReceive && isNft ? "TokenSend" : event.event_kind;
      const verbKey = {
        TokenSend: "desc-sent",
        TokenReceive: "desc-received",
        TokenStake: "desc-staked",
        TokenUnstake: "desc-unstaked",
        TokenClaim: "desc-claimed",
        TokenBurn: "desc-burned",
        TokenMint: "desc-minted",
        TokenCreate: "desc-created",
        TokenSeriesCreate: "desc-created",
      }[resolvedKind];
      if (!verbKey) return acc;
      const verbRaw = echo(verbKey);
      const verb = verbRaw ? `${verbRaw[0]?.toUpperCase()}${verbRaw.slice(1)}` : "";
      const recipient = isReceive && isNft ? event.address : undefined;
      // Keep minting NFTs ungrouped so the description can show the exact minted id.
      const groupKey =
        isMint && isNft
          ? `${resolvedKind}:${symbol}:${event.token_id ?? ""}:${recipient ?? ""}`
          : `${resolvedKind}:${symbol}:${isNft}:${recipient ?? ""}`;
      const existing = acc.get(groupKey);

      if (existing) {
        existing.count += 1;
        existing.order = Math.min(existing.order, index);
        if (isNft && !existing.nftLabel) {
          existing.nftLabel = nftInfo.label;
          existing.nftId = nftInfo.tokenId;
        }
        if (isSeriesCreate && !existing.seriesLabel && seriesInfo.label) {
          existing.seriesLabel = seriesInfo.label;
          existing.seriesId = seriesInfo.seriesId;
        }
        if (!existing.tokenKind && tokenKind) {
          existing.tokenKind = tokenKind;
        }
        if (!existing.toAddress && recipient) {
          existing.toAddress = recipient;
        }
        if (!isNft && amount) {
          existing.amounts.push(amount);
        }
        return acc;
      }

      acc.set(groupKey, {
        kind: resolvedKind,
        verb,
        symbol,
        count: 1,
        isNft,
        nftLabel: isNft ? nftInfo.label : undefined,
        nftId: isNft ? nftInfo.tokenId : undefined,
        seriesLabel: seriesInfo.label,
        seriesId: seriesInfo.seriesId,
        specialResolutionId: undefined,
        tokenKind,
        toAddress: recipient,
        amounts: !isNft && amount ? [amount] : [],
        order: index,
      });
      return acc;
    }, new Map());

    const actions = Array.from(actionGroups.values()).reduce<
      {
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
        order: number;
      }[]
    >((acc, group) => {
      if (!group.symbol && !group.verb && group.kind !== "SpecialResolution") return acc;
      if (group.isNft) {
        acc.push({
          kind: group.kind,
          verb: group.verb,
          amount: "",
          symbol: group.symbol,
          count: group.count,
          isNft: true,
          nftLabel: group.nftLabel,
          nftId: group.nftId,
          seriesLabel: group.seriesLabel,
          seriesId: group.seriesId,
          specialResolutionId: group.specialResolutionId,
          tokenKind: group.tokenKind,
          toAddress: group.toAddress,
          order: group.order,
        });
        return acc;
      }

      const summed = sumDecimalStrings(group.amounts);
      const rawAmount =
        summed ?? (group.count === 1 ? group.amounts[0] ?? "" : "");
      const amount = rawAmount
        ? isNumericString(rawAmount)
          ? formatNumberString(rawAmount)
          : rawAmount
        : "";
      acc.push({
        kind: group.kind,
        verb: group.verb,
        amount,
        symbol: group.symbol,
        count: summed ? 1 : group.count,
        isNft: false,
        seriesLabel: group.seriesLabel,
        seriesId: group.seriesId,
        specialResolutionId: group.specialResolutionId,
        tokenKind: group.tokenKind,
        toAddress: group.toAddress,
        order: group.order,
      });
      return acc;
    }, []);
    const getActionRank = (action: { kind: string; isNft: boolean }) => {
      if (action.kind === "TokenCreate") return 0;
      if (action.kind === "TokenSeriesCreate") return 1;
      if (action.kind === "TokenMint") return 2;
      if (action.kind === "SpecialResolution") return 3;
      if (action.kind === "TokenSend" && action.isNft) return 4;
      if (
        action.kind === "TokenSend" ||
        action.kind === "TokenReceive" ||
        action.kind === "TokenStake" ||
        action.kind === "TokenUnstake" ||
        action.kind === "TokenClaim"
      ) {
        return 5;
      }
      if (action.kind === "TokenBurn") return 6;
      return 7;
    };

    // Keep a deterministic order: creation → special resolution → NFT transfers → fungible actions → burn.
    const orderedActions = [...actions].sort((left, right) => {
      const rankDiff = getActionRank(left) - getActionRank(right);
      if (rankDiff !== 0) return rankDiff;
      return left.order - right.order;
    });

    const senderAddresses = Array.from(
      new Set(sendEvents.map((event) => event.address).filter(Boolean)),
    );
    const receiverAddresses = Array.from(
      new Set(receiveEvents.map((event) => event.address).filter(Boolean)),
    );
    const hasRecipientBreakdown = orderedActions.some((action) => action.toAddress);

    return {
      headline: primaryEvent ? getEventHeadline(primaryEvent, echo) : echo("transaction"),
      actions: orderedActions,
      from: senderAddresses[0] ?? tx.sender?.address ?? "",
      to: receiverAddresses.length === 1 ? receiverAddresses[0] : "",
      toCount: receiverAddresses.length,
      hasRecipientBreakdown,
    };
  }, [echo, tx]);

  const isFailedTx = useMemo(() => {
    const normalized = (tx?.state ?? "").trim().toLowerCase();
    return normalized === "break" || normalized === "fault" || normalized.includes("fail");
  }, [tx?.state]);

  const txTags = useMemo(() => {
    if (!tx || !narrative?.actions?.length) return [];
    const actions = narrative.actions;
    const events = tx.events ?? [];

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
      tags.push({ key: "sr", label: "Special Resolution", tone: "sr" });
    if (hasTokenCreate) tags.push({ key: "deploy", label: "DEPLOY TOKEN", tone: "deploy" });
    if (hasSeriesCreate) tags.push({ key: "series", label: "CREATE SERIES", tone: "series" });
    if (hasMintNft) tags.push({ key: "mint-nft", label: "MINT NFT", tone: "mint" });
    if (hasMintFungible) tags.push({ key: "mint-fungible", label: "MINT FUNGIBLE", tone: "mint" });
    if (hasTrade) tags.push({ key: "trade", label: "TRADE", tone: "trade" });
    if (hasStake) tags.push({ key: "stake", label: "STAKE", tone: "stake" });
    if (hasKcalBurn) tags.push({ key: "burn", label: "BURN", tone: "burn" });
    if (hasTransfer) tags.push({ key: "transfer", label: "TRANSFER", tone: "transfer" });
    if (hasNftTransfer)
      tags.push({
        key: "nft",
        label: nftTransferCount > 1 ? "NFTS" : "NFT",
        tone: "nft",
      });
    if (hasFungibleTransfer)
      tags.push({ key: "fungible", label: "FUNGIBLE", tone: "fungible" });

    return tags;
  }, [narrative?.actions, tx]);

  const renderActionLabel = (action: {
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
          Special resolution{" "}
          {action.specialResolutionId ? `#${action.specialResolutionId}` : "-"}
        </>
      );
    }

    if (action.kind === "TokenSeriesCreate") {
      return (
        <>
          Created series{" "}
          {action.seriesId ? (
            <Link href={`/series/${action.seriesId}`} className="link font-semibold">
              {action.seriesLabel ?? `#${action.seriesId}`}
            </Link>
          ) : (
            "-"
          )}{" "}
          for token{" "}
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
          Deployed {action.tokenKind === "nft" ? "NFT token" : "fungible token"}{" "}
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
          Minted{" "}
          {action.nftId ? (
            <Link href={`/nft/${action.nftId}`} className="link font-semibold">
              #{stringTruncateMiddle(action.nftId, 10, 6)}
            </Link>
          ) : (
            "-"
          )}{" "}
          for token{" "}
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
              "NFT"
            )}
            {action.symbol && action.count > 1 ? " NFTs" : ""}
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
                {" "}
                to{" "}
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
  };

  const timeLabel = useMemo(() => {
    if (!tx?.date) return null;
    const date = unixToDate(tx.date);
    return formatRelativeAge(date);
  }, [tx?.date]);

  const diagnosticsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!config.diagnostics?.enabled || !tx) return;
    const events = tx.events ?? [];
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
  }, [config.apiBaseUrl, config.diagnostics?.enabled, narrative, tx]);

  const overviewItems = useMemo(() => {
    if (!tx) return [];
    return [
      { label: echo("state"), value: <TxStateBadge state={tx.state} /> },
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
  }, [tx, echo]);

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
            <Link href={`/block/${tx.block_hash}`} className="link">
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
      { label: echo("gas_limit"), value: tx.gas_limit ? `${tx.gas_limit} KCAL` : "unlimited" },
      { label: echo("gas_price"), value: tx.gas_price ?? "—" },
      { label: echo("expiration"), value: expiration },
      {
        label: echo("result"),
        value: tx.result ? <span className="break-all">{tx.result}</span> : "—",
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
  }, [tx, echo]);

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
                          <span className="text-rose-500">Failed</span> transaction
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
      router,
      tx,
    ],
  );

  if (isNotFound || (!loading && !error && !tx)) {
    return (
      <AppShell>
        <NotFoundPanel description="Transaction was not found." />
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
