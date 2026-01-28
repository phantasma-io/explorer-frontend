import type { EventResult } from "@/lib/types/api";

const EVENT_VERB_KEYS: Record<string, string> = {
  TokenSend: "desc-sent",
  TokenReceive: "desc-received",
  TokenStake: "desc-staked",
  TokenClaim: "desc-claimed",
  TokenBurn: "desc-burned",
  TokenMint: "desc-minted",
  TokenCreate: "desc-created",
  TokenSeriesCreate: "desc-created",
  GasPayment: "desc-paid",
  GasEscrow: "desc-escrowed",
};

const getEventPrimaryValue = (event: EventResult): string => {
  const tokenSymbol =
    event.token_event?.token?.symbol ??
    event.token_create_event?.token?.symbol ??
    event.token_series_event?.token?.symbol;
  const tokenValue = event.token_event?.value ?? event.token_event?.value_raw;
  const tokenDisplay =
    tokenValue && tokenSymbol
      ? `${tokenValue} ${tokenSymbol}`
      : tokenSymbol || tokenValue || "";

  const nftDisplay = event.nft_metadata?.name
    ? `NFT ${event.nft_metadata.name}`
    : event.token_id
      ? `NFT #${event.token_id}`
      : "";

  const gasDisplay = event.gas_event?.fee
    ? `${event.gas_event.fee} KCAL`
    : event.gas_event?.amount
      ? `${event.gas_event.amount} KCAL`
      : "";

  return (
    tokenDisplay ||
    nftDisplay ||
    gasDisplay ||
    event.string_event?.string_value ||
    event.hash_event?.hash ||
    event.organization_event?.organization?.name ||
    event.market_event?.market_event_kind ||
    event.transaction_settle_event?.chain ||
    event.chain_event?.name ||
    ""
  );
};

export const getEventHeadline = (
  event: EventResult,
  echo: (key: string) => string,
): string => {
  const kind = event.event_kind ?? "";
  const verbKey = EVENT_VERB_KEYS[kind];
  const verbRaw = verbKey ? echo(verbKey) : "";
  const verb = verbRaw ? `${verbRaw[0]?.toUpperCase()}${verbRaw.slice(1)}` : "";
  const primaryValue = getEventPrimaryValue(event);

  if (verb) {
    return primaryValue ? `${verb} ${primaryValue}` : verb;
  }

  const spaced = kind.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced || echo("event");
};
