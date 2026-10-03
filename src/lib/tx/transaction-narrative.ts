import type { EventResult, Transaction, TransactionSummaryRow } from "@/lib/types/api";
import { formatNumberString, stringTruncateMiddle } from "@/lib/utils/format";
import { getEventHeadline } from "@/lib/utils/event-text";

// Builds the one-line description of a transaction ("Sent 78 BRC NFTs to …") from
// the summary the API stores for it: one row per event kind and token, counted and
// summed over every event of the transaction. The page never loads the events for
// this, so the numbers stay exact for a transaction of any size.

// Gas events. The page shows the fee separately, so these events never become an action.
const NOISE_EVENT_KINDS = new Set(["GasEscrow", "GasPayment"]);

// Kinds that are an action of their own. When one of them is present, a transaction
// is not described from the sender's side as a swap.
const EXPLICIT_ACTION_KINDS = new Set([
  "TokenStake",
  "TokenUnstake",
  "TokenClaim",
  "TokenMint",
  "TokenCreate",
  "TokenSeriesCreate",
  "SpecialResolution",
]);

const VERB_KEYS: Record<string, string> = {
  TokenSend: "desc-sent",
  TokenReceive: "desc-received",
  TokenStake: "desc-staked",
  TokenUnstake: "desc-unstaked",
  TokenClaim: "desc-claimed",
  TokenBurn: "desc-burned",
  TokenMint: "desc-minted",
  TokenCreate: "desc-created",
  TokenSeriesCreate: "desc-created",
};

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
  // How many distinct addresses received these NFTs, set only when there are
  // several (one recipient is `toAddress`).
  recipientCount?: number;
  order: number;
};

export type TransactionNarrative = {
  headline: string;
  actions: TransactionNarrativeAction[];
  from: string;
  to: string;
  toCount: number;
  hasRecipientBreakdown: boolean;
  mode: "default" | "initiator-fungible-flows";
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

// A row is about NFTs only when its token says so; rows without a token are not.
const isNftRow = (row: TransactionSummaryRow) =>
  normalizeBoolean(row.token?.fungible) === false;

const isFungibleRow = (row: TransactionSummaryRow) =>
  normalizeBoolean(row.token?.fungible) === true;

const getNftInfo = (event?: EventResult): { label?: string; tokenId?: string } => {
  if (!event) return {};
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

// The kind of a created token. The extended event states it in `is_non_fungible`. An
// event of the main chain up to block 6,422,526 and a gen1 event name only the token,
// which the API resolves from the token rows. A token without a row has no known kind.
const getCreatedTokenKind = (
  created: EventResult["token_create_event"],
): "fungible" | "nft" | undefined => {
  const fungible =
    typeof created?.is_non_fungible === "boolean"
      ? !created.is_non_fungible
      : normalizeBoolean(created?.token?.fungible);
  if (fungible === undefined) return undefined;
  return fungible ? "fungible" : "nft";
};

const getSeriesInfo = (event?: EventResult): { label?: string; seriesId?: string } => {
  const seriesId =
    event?.token_series_event?.series_id ??
    event?.token_series_event?.carbon_series_id ??
    event?.series?.id;
  if (seriesId) {
    return { label: `#${stringTruncateMiddle(seriesId, 10, 6)}`, seriesId };
  }
  return {};
};

const isNumericString = (value: string) => /^-?\d+(\.\d+)?$/.test(value);

const formatAmount = (value?: string) => {
  const amount = value ?? "";
  return isNumericString(amount) ? formatNumberString(amount) : amount;
};

const capitalizeNarrativeVerb = (verbKey: string, echo: EchoFn) => {
  const verbRaw = echo(verbKey);
  return verbRaw ? `${verbRaw[0]?.toUpperCase()}${verbRaw.slice(1)}` : "";
};

// The only address shared by all the given rows, or "" when they name several or
// any of them has more than one.
const commonAddress = (rows: TransactionSummaryRow[]) => {
  const addresses = new Set(rows.map((row) => (row.address_count === 1 ? row.address?.address : undefined)));
  if (addresses.size !== 1) return "";
  return [...addresses][0] ?? "";
};

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

export function buildTransactionNarrative(
  tx: Transaction | undefined,
  summary: TransactionSummaryRow[],
  echo: EchoFn,
): TransactionNarrative | null {
  if (!tx) return null;

  const rows = summary.filter((row) => !NOISE_EVENT_KINDS.has(row.event_kind ?? ""));
  const sendRows = rows.filter((row) => row.event_kind === "TokenSend");
  const receiveRows = rows.filter((row) => row.event_kind === "TokenReceive");
  const symbolsWith = (kindRows: TransactionSummaryRow[], nft: boolean) =>
    new Set(
      kindRows
        .filter((row) => (nft ? isNftRow(row) : isFungibleRow(row)))
        .map((row) => row.token?.symbol ?? ""),
    );
  const fungibleSendSymbols = symbolsWith(sendRows, false);
  const nftReceiveSymbols = symbolsWith(receiveRows, true);

  // A swap reads better from the sender's side: what the sender paid and what the
  // sender got back. The transfers between the exchange's own contracts are left out.
  // The summary keeps the sender's part of every row, so this needs no event.
  const initiatorAddress = tx.sender?.address ?? "";
  const sendsOwnTokens = sendRows.some((row) => isFungibleRow(row) && (row.sender_event_count ?? 0) > 0);
  const receivesOwnTokens = receiveRows.some(
    (row) => isFungibleRow(row) && (row.sender_event_count ?? 0) > 0,
  );
  const initiatorMode =
    Boolean(initiatorAddress) &&
    !rows.some((row) => EXPLICIT_ACTION_KINDS.has(row.event_kind ?? "")) &&
    sendsOwnTokens &&
    receivesOwnTokens;

  const actions: TransactionNarrativeAction[] = [];
  rows.forEach((row, order) => {
    const kind = row.event_kind ?? "";
    const isNft = isNftRow(row);
    const symbol = row.token?.symbol ?? "";
    const count = row.event_count ?? 0;
    const firstEvent = row.first_event;

    if (initiatorMode && isFungibleRow(row) && (kind === "TokenSend" || kind === "TokenReceive")) {
      if ((row.sender_event_count ?? 0) === 0) return;
      actions.push({
        kind,
        verb: capitalizeNarrativeVerb(VERB_KEYS[kind], echo),
        amount: formatAmount(row.sender_amount),
        symbol,
        count: 1,
        isNft: false,
        order,
      });
      return;
    }

    if (kind === "SpecialResolution") {
      const resolutionId = firstEvent?.special_resolution_event?.resolution_id ?? firstEvent?.event_id;
      actions.push({
        kind,
        verb: "",
        amount: "",
        symbol: "",
        count,
        isNft: false,
        specialResolutionId:
          resolutionId !== undefined && resolutionId !== null ? String(resolutionId) : undefined,
        order,
      });
      return;
    }

    if (kind === "TokenCreate") {
      const created = firstEvent?.token_create_event;
      actions.push({
        kind,
        verb: capitalizeNarrativeVerb(VERB_KEYS[kind], echo),
        amount: "",
        symbol: created?.token?.symbol ?? "",
        count,
        isNft: false,
        tokenKind: getCreatedTokenKind(created),
        order,
      });
      return;
    }

    if (kind === "TokenSeriesCreate") {
      const series = getSeriesInfo(firstEvent);
      actions.push({
        kind,
        verb: capitalizeNarrativeVerb(VERB_KEYS[kind], echo),
        amount: "",
        symbol: firstEvent?.token_series_event?.token?.symbol ?? symbol,
        count,
        isNft: false,
        seriesLabel: series.label,
        seriesId: series.seriesId,
        order,
      });
      return;
    }

    if (!VERB_KEYS[kind] || !symbol) return;

    // A transfer has a send row and a receive row for the same token. It is told
    // once: a fungible transfer by what was sent, an NFT transfer by who received it.
    if (kind === "TokenSend" && isNft && nftReceiveSymbols.has(symbol)) return;
    if (kind === "TokenReceive" && !isNft && fungibleSendSymbols.has(symbol)) return;

    // The fee burn of every transaction is routine; a KCAL burn is an action only
    // from 1 KCAL up.
    if (kind === "TokenBurn" && symbol === "KCAL" && Number(row.amount ?? "0") < 1) return;

    const nftTransfer = isNft && kind === "TokenReceive";
    const nft = isNft && count === 1 ? getNftInfo(firstEvent) : {};
    const recipients = row.address_count ?? 0;
    actions.push({
      kind: nftTransfer ? "TokenSend" : kind,
      verb: capitalizeNarrativeVerb(VERB_KEYS[nftTransfer ? "TokenSend" : kind], echo),
      amount: isNft ? "" : formatAmount(row.amount),
      symbol,
      count: isNft ? count : 1,
      isNft,
      nftLabel: nft.label,
      nftId: nft.tokenId,
      toAddress: nftTransfer && recipients === 1 ? row.address?.address : undefined,
      recipientCount: nftTransfer && recipients > 1 ? recipients : undefined,
      order,
    });
  });

  const orderedActions = [...actions].sort((left, right) => {
    const rankDiff = getActionRank(left) - getActionRank(right);
    if (rankDiff !== 0) return rankDiff;
    return left.order - right.order;
  });

  // "To N recipients" needs an exact N. It is known when all received tokens went to
  // one address, or when there is a single receive row; otherwise no count is shown.
  const singleRecipient = commonAddress(receiveRows);
  const recipientCount = singleRecipient
    ? 1
    : receiveRows.length === 1
      ? (receiveRows[0].address_count ?? 0)
      : 0;
  const headlineEvent = rows[0]?.first_event ?? summary[0]?.first_event;

  return {
    headline: headlineEvent ? getEventHeadline(headlineEvent, echo) : echo("transaction"),
    actions: orderedActions,
    from: initiatorMode ? initiatorAddress : commonAddress(sendRows) || initiatorAddress,
    to: initiatorMode ? "" : singleRecipient,
    toCount: initiatorMode ? 0 : recipientCount,
    hasRecipientBreakdown: initiatorMode
      ? false
      : orderedActions.some((action) => action.toAddress || action.recipientCount),
    mode: initiatorMode ? "initiator-fungible-flows" : "default",
    initiatorAddress: initiatorAddress || undefined,
  };
}
