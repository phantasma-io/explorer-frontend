"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { EventResult } from "@/lib/types/api";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

interface EventLineProps {
  event: EventResult;
  showPayload?: boolean;
}

export function EventLine({ event, showPayload = false }: EventLineProps) {
  const { echo } = useEcho();

  const headline = useMemo(() => {
    const kind = event.event_kind ?? "";
    const verbKey: Record<string, string> = {
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

    const verbRaw = verbKey[kind] ? echo(verbKey[kind]) : "";
    const verb = verbRaw ? `${verbRaw[0]?.toUpperCase()}${verbRaw.slice(1)}` : "";

    const tokenSymbol =
      event.token_event?.token?.symbol ??
      event.token_create_event?.token?.symbol ??
      event.token_series_event?.token?.symbol;
    const tokenValue = event.token_event?.value ?? event.token_event?.value_raw;
    const tokenDisplay =
      tokenValue && tokenSymbol ? `${tokenValue} ${tokenSymbol}` : tokenSymbol || tokenValue || "";

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

    const primaryValue =
      tokenDisplay ||
      nftDisplay ||
      gasDisplay ||
      event.string_event?.string_value ||
      event.hash_event?.hash ||
      event.organization_event?.organization?.name ||
      event.market_event?.market_event_kind ||
      event.transaction_settle_event?.chain ||
      event.chain_event?.name ||
      "";

    if (verb) {
      return primaryValue ? `${verb} ${primaryValue}` : verb;
    }

    // Fall back to a spaced event kind for unknown verbs (e.g., "TokenSend" -> "Token Send").
    const spaced = kind.replace(/([a-z])([A-Z])/g, "$1 $2");
    return spaced || echo("event");
  }, [echo, event]);

  const details = useMemo(() => {
    const parts: string[] = [];

    // Prefer structured event payloads first, then fall back to raw snippets when needed.
    if (event.token_event?.value || event.token_event?.token?.symbol) {
      parts.push(
        [event.token_event?.value, event.token_event?.token?.symbol]
          .filter(Boolean)
          .join(" ")
          .trim(),
      );
    }

    if (event.nft_metadata?.name) {
      parts.push(event.nft_metadata.name);
    } else if (event.token_id) {
      parts.push(`#${event.token_id}`);
    }

    if (event.string_event?.string_value) {
      parts.push(event.string_event.string_value);
    }

    if (event.sale_event?.sale_event_kind) {
      parts.push(event.sale_event.sale_event_kind);
    }

    if (event.organization_event?.organization?.name) {
      parts.push(event.organization_event.organization.name);
    }

    if (event.transaction_settle_event?.hash) {
      parts.push(event.transaction_settle_event.hash);
    }
    if (event.transaction_settle_event?.platform?.name) {
      parts.push(event.transaction_settle_event.platform.name);
    }
    if (event.transaction_settle_event?.chain) {
      parts.push(event.transaction_settle_event.chain);
    }

    if (event.market_event?.market_event_kind) {
      parts.push(event.market_event.market_event_kind);
    }

    if (event.market_event?.price) {
      const pair =
        event.market_event?.base_token?.symbol && event.market_event?.quote_token?.symbol
          ? `${event.market_event.base_token.symbol}/${event.market_event.quote_token.symbol}`
          : "";
      const price = `${event.market_event.price} ${event.market_event.quote_token?.symbol ?? ""}`.trim();
      parts.push([pair, price].filter(Boolean).join(" "));
    }

    if (event.infusion_event?.infused_value) {
      parts.push(
        `${event.infusion_event.infused_value} ${event.infusion_event.infused_token?.symbol ?? ""}`.trim(),
      );
    }

    if (event.hash_event?.hash) {
      parts.push(event.hash_event.hash);
    }

    if (event.gas_event?.fee) {
      parts.push(`${event.gas_event.fee} KCAL`);
    } else if (event.gas_event?.amount) {
      parts.push(`${event.gas_event.amount} KCAL`);
    }

    if (event.chain_event?.name || event.chain_event?.value) {
      parts.push([event.chain_event?.name, event.chain_event?.value].filter(Boolean).join(": "));
    }

    if (event.token_create_event?.token?.symbol) {
      parts.push(event.token_create_event.token.symbol);
    }

    if (event.token_series_event?.series_id) {
      parts.push(`#${event.token_series_event.series_id}`);
    }

    if (!parts.length) {
      const payload = event.payload_json || event.raw_data || event.unknown_event?.payload_json || event.unknown_event?.raw_data || "";
      if (payload) {
        parts.push(payload.length > 120 ? `${payload.slice(0, 120)}…` : payload);
      }
    }

    return parts.filter(Boolean).join(" · ");
  }, [event]);

  const payload = useMemo(() => {
    if (!showPayload) return "";
    // Show a short payload excerpt for activity views without flooding the UI.
    const raw = event.payload_json || event.raw_data || event.unknown_event?.payload_json || event.unknown_event?.raw_data || "";
    if (!raw) return "";
    return raw.length > 320 ? `${raw.slice(0, 320)}…` : raw;
  }, [event, showPayload]);

  return (
    <div className="rounded-xl border border-border/70 bg-card/85 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {event.event_kind ?? "Unknown"}
        </span>
        {event.address ? (
          <Link href={`/address/${event.address}`} className="text-xs font-semibold link">
            {stringTruncateMiddle(event.address, 6, 4)}
          </Link>
        ) : null}
        {headline ? <span className="text-sm font-semibold text-foreground">{headline}</span> : null}
      </div>
      {details ? (
        <div className="mt-2 text-xs text-muted-foreground">{details}</div>
      ) : null}
      {payload ? (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-mono">{payload}</span>
        </div>
      ) : null}
    </div>
  );
}
