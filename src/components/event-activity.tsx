"use client";

import Link from "next/link";
import type { EventResult } from "@/lib/types/api";
import { EventTypeDetails } from "@/components/event-type-details";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { useEcho } from "@/lib/i18n/use-echo";

interface EventActivityProps {
  events?: EventResult[];
}

export function EventActivity({ events }: EventActivityProps) {
  const { echo } = useEcho();

  if (!events?.length) return null;

  return (
    <div className="grid gap-3">
      <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("activity")}
      </div>
      <div className="grid gap-2">
        {events.map((event, index) => {
          const dateLabel = event.date ? formatDateTime(unixToDate(event.date)) : "—";
          return (
            <div
              key={`${event.event_id ?? ""}-${event.event_kind ?? ""}-${index}`}
              className="rounded-xl border border-border/70 bg-card/85 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {event.event_kind ?? "Unknown"}
                  </span>
                  {event.event_id ? (
                    <Link href={`/event/${event.event_id}`} className="text-xs font-semibold link">
                      #{event.event_id}
                    </Link>
                  ) : null}
                  {event.address ? (
                    <Link href={`/address/${event.address}`} className="text-xs font-semibold link">
                      {event.address}
                    </Link>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">{dateLabel}</div>
              </div>
              <EventTypeDetails event={event} variant="compact" showUnknownPayload />
            </div>
          );
        })}
      </div>
    </div>
  );
}
