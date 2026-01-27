"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { eventTypeMap } from "@/lib/events/event-type-map";
import type { EventKinds, EventResult, EventTypes, SpecialResolutionCall } from "@/lib/types/api";
import { DetailList } from "@/components/detail-list";
import { useEcho } from "@/lib/i18n/use-echo";

interface EventTypeDetailsProps {
  event: EventResult;
  variant?: "full" | "compact";
  showUnknownPayload?: boolean;
}

interface DetailItem {
  label: string;
  value: ReactNode;
}

const isEmptyValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
};

const formatResolutionCall = (call?: SpecialResolutionCall) => {
  if (!call) return "";
  const method = call.method ?? (call.method_id !== undefined ? `${call.method_id}` : "");
  const module = call.module ?? (call.module_id !== undefined ? `${call.module_id}` : "");
  if (module && method) return `${module}.${method}`;
  return module || method || "";
};

const flattenResolutionCalls = (calls?: SpecialResolutionCall[]) => {
  if (!calls?.length) return [] as SpecialResolutionCall[];
  const result: SpecialResolutionCall[] = [];
  // Flatten nested resolution calls so we can summarize them in a single line.
  const walk = (items?: SpecialResolutionCall[]) => {
    if (!items) return;
    items.forEach((item) => {
      result.push(item);
      if (item.calls?.length) {
        walk(item.calls);
      }
    });
  };

  walk(calls);
  return result;
};

export function EventTypeDetails({ event, variant = "full", showUnknownPayload = false }: EventTypeDetailsProps) {
  const { echo } = useEcho();

  const kind = event.event_kind as EventKinds | undefined;
  const type: EventTypes | null | undefined = kind ? eventTypeMap[kind] : null;

  const items = useMemo<DetailItem[]>(() => {
    const details: DetailItem[] = [];

    const push = (label: string, value: ReactNode) => {
      if (isEmptyValue(value)) return;
      details.push({ label, value });
    };

    // Translate the extended event payload into a labeled list of fields.
    switch (type) {
      case "string_event":
        push(echo("value"), event.string_event?.string_value ?? "—");
        break;
      case "sale_event":
        push(echo("type"), event.sale_event?.sale_event_kind ?? "—");
        push(echo("hash"), event.sale_event?.hash ?? "—");
        break;
      case "organization_event":
        push(echo("dao-name"), event.organization_event?.organization?.name ?? "—");
        if (event.organization_event?.address?.address) {
          push(
            echo("address"),
            <Link href={`/address/${event.organization_event.address.address}`} className="link">
              {event.organization_event.address.address}
            </Link>,
          );
        }
        break;
      case "token_create_event":
        push(echo("token"), event.token_create_event?.token?.symbol ?? "—");
        push(echo("max_supply"), event.token_create_event?.max_supply ?? "—");
        push(echo("decimals"), event.token_create_event?.decimals ?? "—");
        if (event.token_create_event?.is_non_fungible !== undefined) {
          push("Non-fungible", `${event.token_create_event.is_non_fungible}`);
        }
        push("Carbon token", event.token_create_event?.carbon_token_id ?? "—");
        break;
      case "token_series_event":
        push("Series", event.token_series_event?.series_id ?? "—");
        push(echo("token"), event.token_series_event?.token?.symbol ?? "—");
        if (event.token_series_event?.owner?.address) {
          push(
            echo("owner"),
            <Link href={`/address/${event.token_series_event.owner.address}`} className="link">
              {event.token_series_event.owner.address}
            </Link>,
          );
        }
        push(echo("max_supply"), event.token_series_event?.max_supply ?? "—");
        push("Max mint", event.token_series_event?.max_mint ?? "—");
        push("Carbon series", event.token_series_event?.carbon_series_id ?? "—");
        push("Carbon token", event.token_series_event?.carbon_token_id ?? "—");
        break;
      case "market_event":
        push(echo("type"), event.market_event?.market_event_kind ?? "—");
        if (event.market_event?.base_token?.symbol) {
          push(
            echo("base-token"),
            <Link href={`/token/${event.market_event.base_token.symbol}`} className="link">
              {event.market_event.base_token.symbol}
            </Link>,
          );
        }
        if (event.market_event?.quote_token?.symbol) {
          push(
            echo("infused-token"),
            <Link href={`/token/${event.market_event.quote_token.symbol}`} className="link">
              {event.market_event.quote_token.symbol}
            </Link>,
          );
        }
        push(echo("value"), event.market_event?.price ?? "—");
        push("End price", event.market_event?.end_price ?? "—");
        break;
      case "infusion_event":
        if (event.infusion_event?.base_token?.symbol) {
          push(
            echo("base-token"),
            <Link href={`/token/${event.infusion_event.base_token.symbol}`} className="link">
              {event.infusion_event.base_token.symbol}
            </Link>,
          );
        }
        if (event.infusion_event?.infused_token?.symbol) {
          push(
            echo("infused-token"),
            <Link href={`/token/${event.infusion_event.infused_token.symbol}`} className="link">
              {event.infusion_event.infused_token.symbol}
            </Link>,
          );
        }
        push(echo("value"), event.infusion_event?.infused_value ?? "—");
        push("Token ID", event.infusion_event?.token_id ?? "—");
        break;
      case "hash_event":
        push(echo("hash"), event.hash_event?.hash ?? "—");
        break;
      case "gas_event": {
        push(echo("fee"), event.gas_event?.fee ?? "—");
        const amount = event.gas_event?.amount;
        push(echo("amount"), amount && amount !== "" ? amount : "unlimited");
        if (event.gas_event?.address?.address) {
          push(
            echo("address"),
            <Link href={`/address/${event.gas_event.address.address}`} className="link">
              {event.gas_event.address.address}
            </Link>,
          );
        }
        break;
      }
      case "governance_gas_config_event": {
        const fields = [
          { label: "version", value: event.governance_gas_config_event?.version },
          { label: "fee multiplier", value: event.governance_gas_config_event?.fee_multiplier },
          { label: "fee shift", value: event.governance_gas_config_event?.fee_shift },
          { label: "gas token id", value: event.governance_gas_config_event?.gas_token_id },
          { label: "data token id", value: event.governance_gas_config_event?.data_token_id },
          { label: "minimum gas offer", value: event.governance_gas_config_event?.minimum_gas_offer },
          { label: "gas fee transfer", value: event.governance_gas_config_event?.gas_fee_transfer },
          { label: "gas fee query", value: event.governance_gas_config_event?.gas_fee_query },
          { label: "gas fee per byte", value: event.governance_gas_config_event?.gas_fee_per_byte },
          { label: "gas fee create token (base)", value: event.governance_gas_config_event?.gas_fee_create_token_base },
          { label: "gas fee create token (symbol)", value: event.governance_gas_config_event?.gas_fee_create_token_symbol },
          { label: "gas fee create token (series)", value: event.governance_gas_config_event?.gas_fee_create_token_series },
          { label: "gas fee register name", value: event.governance_gas_config_event?.gas_fee_register_name },
          { label: "max structure size", value: event.governance_gas_config_event?.max_structure_size },
          { label: "max name length", value: event.governance_gas_config_event?.max_name_length },
          { label: "max token symbol length", value: event.governance_gas_config_event?.max_token_symbol_length },
          { label: "data escrow per row", value: event.governance_gas_config_event?.data_escrow_per_row },
          { label: "gas burn ratio (mul)", value: event.governance_gas_config_event?.gas_burn_ratio_mul },
          { label: "gas burn ratio (shift)", value: event.governance_gas_config_event?.gas_burn_ratio_shift },
        ];

        fields.forEach((field) => {
          if (!isEmptyValue(field.value)) {
            push(field.label, `${field.value}`);
          }
        });
        break;
      }
      case "governance_chain_config_event": {
        const fields = [
          { label: "version", value: event.governance_chain_config_event?.version },
          { label: "allowed tx types", value: event.governance_chain_config_event?.allowed_tx_types },
          { label: "expiry window", value: event.governance_chain_config_event?.expiry_window },
          { label: "block rate target", value: event.governance_chain_config_event?.block_rate_target },
          { label: "reserved 1", value: event.governance_chain_config_event?.reserved_1 },
          { label: "reserved 2", value: event.governance_chain_config_event?.reserved_2 },
          { label: "reserved 3", value: event.governance_chain_config_event?.reserved_3 },
        ];

        fields.forEach((field) => {
          if (!isEmptyValue(field.value)) {
            push(field.label, `${field.value}`);
          }
        });
        break;
      }
      case "special_resolution_event": {
        const resolution = event.special_resolution_event;
        const calls = flattenResolutionCalls(resolution?.calls).map(formatResolutionCall).filter(Boolean);

        push("Resolution", resolution?.resolution_id ?? "—");
        push("Payload", resolution?.description ?? "—");
        if (calls.length) {
          push("Calls", calls.join(", "));
          push("Call count", `${calls.length}`);
        }
        break;
      }
      case "chain_event":
        push(echo("name"), event.chain_event?.name ?? "—");
        push(echo("value"), event.chain_event?.value ?? "—");
        push(echo("chain"), event.chain_event?.chain?.chain_name ?? "—");
        push(echo("height"), event.chain_event?.chain?.chain_height ?? "—");
        break;
      case "address_event":
        if (event.address_event?.address?.address) {
          push(
            echo("address"),
            <Link href={`/address/${event.address_event.address.address}`} className="link">
              {event.address_event.address.address}
            </Link>,
          );
        }
        break;
      case "token_event": {
        const tokenValue = event.token_event?.value ?? event.token_event?.value_raw ?? "";
        push(echo("value"), tokenValue || "—");
        if (event.token_event?.token?.symbol) {
          push(
            echo("token"),
            <Link href={`/token/${event.token_event.token.symbol}`} className="link">
              {event.token_event.token.symbol}
            </Link>,
          );
        }
        if (event.token_id) {
          // Token ID often represents an NFT; link to NFT details when applicable.
          const isNft = event.token_event?.token?.fungible === false || Boolean(event.nft_metadata);
          const tokenIdValue = isNft ? (
            <Link href={`/nft/${event.token_id}`} className="link">
              {event.token_id}
            </Link>
          ) : (
            event.token_id
          );
          push("Token ID", tokenIdValue);
        }
        if (event.nft_metadata?.name) {
          push("NFT Name", event.nft_metadata.name);
        }
        if (event.address) {
          push(
            echo("address"),
            <Link href={`/address/${event.address}`} className="link">
              {event.address}
            </Link>,
          );
        }
        break;
      }
      case "transaction_settle_event":
        push(echo("hash"), event.transaction_settle_event?.hash ?? "—");
        push("Platform", event.transaction_settle_event?.platform?.name ?? "—");
        push(echo("chain"), event.transaction_settle_event?.chain ?? "—");
        break;
      case "unknown_event": {
        if (showUnknownPayload) {
          const payload = event.unknown_event?.payload_json ?? event.payload_json ?? "";
          const raw = event.unknown_event?.raw_data ?? event.raw_data ?? "";
          push(echo("payload"), payload || raw || "—");
        }
        break;
      }
      default:
        if (showUnknownPayload) {
          const payload = event.payload_json ?? event.raw_data ?? "";
          push(echo("payload"), payload || "—");
        }
        break;
    }

    return details.filter((item) => !isEmptyValue(item.value));
  }, [echo, event, showUnknownPayload, type]);

  if (!items.length) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {item.label}
            </span>
            <span className="text-sm text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return <DetailList items={items} />;
}
