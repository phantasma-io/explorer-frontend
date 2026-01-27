"use client";

import { useMemo } from "react";
import type { EventResult } from "@/lib/types/api";
import { useEcho } from "@/lib/i18n/use-echo";
import { EventLine } from "@/components/event-line";

interface EventSummaryProps {
  events?: EventResult[];
}

export function EventSummary({ events }: EventSummaryProps) {
  const { echo } = useEcho();

  const ordered = useMemo(() => {
    if (!events?.length) return [];

    const priority = (event: EventResult) => {
      // Prioritize high-signal events and deprioritize gas-only noise when possible.
      switch (event.event_kind) {
        case "TokenCreate":
        case "TokenSeriesCreate":
        case "ContractDeploy":
        case "PlatformCreate":
        case "OrganizationCreate":
        case "Crowdsale":
        case "ChainCreate":
          return 0;
        case "TokenMint":
        case "TokenSend":
        case "TokenReceive":
        case "TokenBurn":
        case "TokenStake":
        case "TokenClaim":
        case "Infusion":
        case "OrderCreated":
        case "OrderFilled":
        case "OrderCancelled":
        case "OrderClosed":
        case "OrderBid":
        case "ChainSwap":
        case "ValueCreate":
        case "ValueUpdate":
        case "ValidatorElect":
        case "ValidatorPropose":
        case "ValidatorSwitch":
        case "OrganizationAdd":
        case "OrganizationRemove":
          return 1;
        case "GasEscrow":
        case "GasPayment":
          return 3;
        default:
          return 2;
      }
    };

    const nonGas = events.filter(
      (event) => event.event_kind !== "GasEscrow" && event.event_kind !== "GasPayment",
    );
    const base = nonGas.length > 0 ? nonGas : events;

    return [...base].sort((a, b) => priority(a) - priority(b));
  }, [events]);

  if (!ordered.length) return null;

  return (
    <div className="grid gap-3">
      <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("desc")}
      </div>
      <div className="grid gap-2">
        {ordered.map((event, index) => (
          <EventLine
            key={`${event.event_id ?? ""}-${event.event_kind ?? ""}-${index}`}
            event={event}
          />
        ))}
      </div>
    </div>
  );
}
