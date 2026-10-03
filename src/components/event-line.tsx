"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { EventResult } from "@/lib/types/api";
import { formatRawTokenAmount, stringTruncateMiddle } from "@/lib/utils/format";
import { getEventHeadline, isNftTokenEvent } from "@/lib/utils/event-text";
import { useEcho } from "@/lib/i18n/use-echo";

interface EventLineProps {
  event: EventResult;
  showPayload?: boolean;
}

export function EventLine({ event, showPayload = false }: EventLineProps) {
  const { echo } = useEcho();

  const headline = useMemo(() => getEventHeadline(event, echo), [echo, event]);

  const details = useMemo(() => {
    const parts: string[] = [];
    const isNft = isNftTokenEvent(event);

    // Prefer structured event payloads first, then fall back to raw snippets when needed.
    // NFT token events carry the token id in `value`, so the amount form only applies to
    // fungible ones; the id itself is shown once below, truncated.
    if (!isNft && (event.token_event?.value || event.token_event?.token?.symbol)) {
      parts.push(
        [event.token_event?.value, event.token_event?.token?.symbol]
          .filter(Boolean)
          .join(" ")
          .trim(),
      );
    }

    if (event.nft_metadata?.name) {
      parts.push(event.nft_metadata.name);
    } else if (isNft && event.token_id) {
      parts.push(`#${stringTruncateMiddle(event.token_id, 10, 6)}`);
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
      // The API serves market prices in raw units; scale by the quote token's decimals.
      const quoteDecimals = event.market_event.quote_token?.decimals ?? 8;
      const price = `${formatRawTokenAmount(event.market_event.price, quoteDecimals, quoteDecimals)} ${
        event.market_event.quote_token?.symbol ?? ""
      }`.trim();
      parts.push([pair, price].filter(Boolean).join(" "));
    }

    if (event.infusion_event?.infused_value) {
      // Fungible infusions store a raw amount (scale by decimals); NFT infusions store
      // the infused token id, which reads better truncated.
      const infusedToken = event.infusion_event.infused_token;
      const infusedDisplay =
        infusedToken?.fungible === false
          ? `#${stringTruncateMiddle(event.infusion_event.infused_value, 10, 6)}`
          : formatRawTokenAmount(
              event.infusion_event.infused_value,
              infusedToken?.decimals ?? 0,
              infusedToken?.decimals ?? 0,
            );
      parts.push(`${infusedDisplay} ${infusedToken?.symbol ?? ""}`.trim());
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

    // The details join the texts of the event's fields with " · ". Two fields can give
    // the same text: a TokenCreate event of the main chain up to block 6,422,526 has the
    // token symbol in `string_event` and in `token_create_event.token`. A repeated text
    // is shown once.
    return [...new Set(parts.filter(Boolean))].join(" · ");
  }, [event]);

  const payload = useMemo(() => {
    if (!showPayload) return "";
    // Show a short payload excerpt for activity views without flooding the UI.
    const raw = event.payload_json || event.raw_data || event.unknown_event?.payload_json || event.unknown_event?.raw_data || "";
    if (!raw) return "";
    return raw.length > 320 ? `${raw.slice(0, 320)}…` : raw;
  }, [event, showPayload]);

  return (
    <div className="rounded-xl border border-border/70 bg-card/85 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/30">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {event.event_name ?? event.event_kind ?? "Unknown"}
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
