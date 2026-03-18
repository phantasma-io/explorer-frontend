import type { EventResult, Transaction } from "@/lib/types/api";
import { formatNumberString, stringTruncateMiddle } from "@/lib/utils/format";
import { getEventHeadline } from "@/lib/utils/event-text";

export const ACTION_EVENT_KINDS = new Set([
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
const EXPLICIT_ACTION_KINDS = new Set([
  "TokenStake",
  "TokenUnstake",
  "TokenClaim",
  "TokenMint",
  "TokenCreate",
  "TokenSeriesCreate",
  "SpecialResolution",
]);

type EchoFn = (key: string) => string;

export type TransactionNarrativeAction = {
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
};

export type TransactionNarrative = {
  headline: string;
  actions: TransactionNarrativeAction[];
  from: string;
  to: string;
  toCount: number;
  hasRecipientBreakdown: boolean;
  mode: "default" | "initiator-fungible-net";
  initiatorAddress?: string;
};

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

// String-based addition keeps large decimal sums accurate without float precision loss.
const sumDecimalStrings = (values: string[]): string | null => {
  if (!values.length) return null;
  if (!values.every((value) => isNumericString(value))) return null;

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
  const scaled = negative ? -total : total;
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

const capitalizeNarrativeVerb = (verbKey: string, echo: EchoFn) => {
  const verbRaw = echo(verbKey);
  return verbRaw ? `${verbRaw[0]?.toUpperCase()}${verbRaw.slice(1)}` : "";
};

const negateDecimalString = (value: string): string => {
  if (!isNumericString(value) || value === "0") return value;
  return value.startsWith("-") ? value.slice(1) : `-${value}`;
};

const absoluteDecimalString = (value: string): string =>
  value.startsWith("-") ? value.slice(1) : value;

const isZeroDecimalString = (value: string): boolean => /^-?0(?:\.0+)?$/.test(value);

const getInitiatorAddress = (tx: Transaction): string =>
  tx.sender?.address ?? tx.gas_payer?.address ?? "";

const shouldUseInitiatorFungibleNet = (
  tx: Transaction,
  actionEvents: EventResult[],
): { enabled: boolean; initiatorAddress: string } => {
  const initiatorAddress = getInitiatorAddress(tx);
  if (!initiatorAddress) {
    return { enabled: false, initiatorAddress: "" };
  }

  const hasExplicitActionKinds = actionEvents.some((event) =>
    EXPLICIT_ACTION_KINDS.has(event.event_kind ?? ""),
  );
  if (hasExplicitActionKinds) {
    return { enabled: false, initiatorAddress };
  }

  const initiatorFungibleSend = actionEvents.some(
    (event) =>
      event.event_kind === "TokenSend" &&
      !resolveIsNft(event) &&
      event.address === initiatorAddress,
  );
  const initiatorFungibleReceive = actionEvents.some(
    (event) =>
      event.event_kind === "TokenReceive" &&
      !resolveIsNft(event) &&
      event.address === initiatorAddress,
  );

  return {
    enabled: initiatorFungibleSend && initiatorFungibleReceive,
    initiatorAddress,
  };
};

type ActionGroup = {
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
};

export function buildTransactionNarrative(
  tx: Transaction | undefined,
  events: EventResult[],
  echo: EchoFn,
): TransactionNarrative | null {
  if (!tx) return null;

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
  const initiatorMode = shouldUseInitiatorFungibleNet(tx, actionEvents);

  const filteredEvents = actionEvents.filter((event) => {
    if (!event.event_kind) return false;
    const isNft = resolveIsNft(event);

    // Swap-like contract transactions are easier to read from the initiator's perspective.
    // In this mode we keep only the initiator's fungible inflows/outflows and later net them
    // per symbol. This avoids pool/router internals hijacking the top-line description.
    if (
      initiatorMode.enabled &&
      !isNft &&
      (event.event_kind === "TokenSend" || event.event_kind === "TokenReceive")
    ) {
      return event.address === initiatorMode.initiatorAddress;
    }

    // The default path keeps the historical simple-transfer behavior:
    // collapse mirrored send/receive pairs so a regular transfer is described once.
    if (event.event_kind === "TokenReceive") {
      if (!isNft && sendKeys.size) {
        const key = getEventKey(event, false);
        return !key || !sendKeys.has(key);
      }
      return true;
    }

    if (event.event_kind === "TokenSend") {
      if (isNft && receiveKeys.size) {
        const key = getEventKey(event, true);
        return !key || !receiveKeys.has(key);
      }
    }

    return true;
  });

  const actionGroups = filteredEvents.reduce<Map<string, ActionGroup>>((acc, event, index) => {
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

    if (
      initiatorMode.enabled &&
      !isNft &&
      (event.event_kind === "TokenSend" || event.event_kind === "TokenReceive")
    ) {
      const signedAmount = amount
        ? event.event_kind === "TokenReceive"
          ? amount
          : negateDecimalString(amount)
        : "";
      const groupKey = `InitiatorFungible:${symbol}`;
      const existing = acc.get(groupKey);
      if (existing) {
        existing.count += 1;
        existing.order = Math.min(existing.order, index);
        if (signedAmount) {
          existing.amounts.push(signedAmount);
        }
        return acc;
      }

      acc.set(groupKey, {
        kind: "InitiatorFungible",
        verb: "",
        symbol,
        count: 1,
        isNft: false,
        amounts: signedAmount ? [signedAmount] : [],
        order: index,
      });
      return acc;
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
    const recipient = isReceive && isNft ? event.address : undefined;
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
      verb: capitalizeNarrativeVerb(verbKey, echo),
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

  const actions = Array.from(actionGroups.values()).reduce<TransactionNarrativeAction[]>(
    (acc, group) => {
      if (group.kind === "InitiatorFungible") {
        const net = sumDecimalStrings(group.amounts);
        if (!net || isZeroDecimalString(net)) {
          return acc;
        }

        const kind = net.startsWith("-") ? "TokenSend" : "TokenReceive";
        const amountRaw = absoluteDecimalString(net);
        const amount = isNumericString(amountRaw)
          ? formatNumberString(amountRaw)
          : amountRaw;

        acc.push({
          kind,
          verb: capitalizeNarrativeVerb(
            kind === "TokenReceive" ? "desc-received" : "desc-sent",
            echo,
          ),
          amount,
          symbol: group.symbol,
          count: 1,
          isNft: false,
          order: group.order,
        });
        return acc;
      }

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
    },
    [],
  );

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

  const orderedActions = [...actions].sort((left, right) => {
    const rankDiff = getActionRank(left) - getActionRank(right);
    if (rankDiff !== 0) return rankDiff;
    return left.order - right.order;
  });

  const senderAddresses = Array.from(
    new Set(
      sendEvents
        .map((event) => event.address)
        .filter((address): address is string => Boolean(address)),
    ),
  );
  const receiverAddresses = Array.from(
    new Set(
      receiveEvents
        .map((event) => event.address)
        .filter((address): address is string => Boolean(address)),
    ),
  );
  const hasRecipientBreakdown = orderedActions.some((action) => action.toAddress);

  return {
    headline: primaryEvent ? getEventHeadline(primaryEvent, echo) : echo("transaction"),
    actions: orderedActions,
    from:
      initiatorMode.enabled
        ? initiatorMode.initiatorAddress
        : senderAddresses[0] ?? tx.sender?.address ?? "",
    to: initiatorMode.enabled ? "" : receiverAddresses.length === 1 ? receiverAddresses[0] : "",
    toCount: initiatorMode.enabled ? 0 : receiverAddresses.length,
    hasRecipientBreakdown: initiatorMode.enabled ? false : hasRecipientBreakdown,
    mode: initiatorMode.enabled ? "initiator-fungible-net" : "default",
    initiatorAddress: initiatorMode.initiatorAddress || undefined,
  };
}
