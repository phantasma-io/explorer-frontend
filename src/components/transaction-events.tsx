"use client";

import { useEffect, useRef } from "react";
import { EventActivity } from "@/components/event-activity";
import { EventSummary } from "@/components/event-summary";
import { TablePagination } from "@/components/table-controls";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import { useEcho } from "@/lib/i18n/use-echo";
import type { EventResults } from "@/lib/types/api";

interface TransactionEventsProps {
  transactionHash: string;
  // "summary" is the event list under the description, "activity" the Activity tab.
  variant: "summary" | "activity";
}

// Shows one page of a transaction's events and pages through the rest with the
// cursor. A transaction can hold any number of events, so the list never loads all
// of them; the page controls appear when there is more than one page.
export function TransactionEvents({ transactionHash, variant }: TransactionEventsProps) {
  const { echo } = useEcho();
  const table = useTable();
  const { onPageData, resetPagination } = table;
  const previousHash = useRef(transactionHash);

  const { data, loading, error } = useApi<EventResults>(
    endpoints.events({
      transaction_hash: transactionHash,
      chain: "",
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: "date",
      order_direction: "desc",
      with_event_data: 1,
      with_fiat: 0,
    }),
  );

  useEffect(() => {
    onPageData(data?.next_cursor ?? null, data?.events?.length ?? 0);
  }, [onPageData, data?.next_cursor, data?.events?.length]);

  useEffect(() => {
    // The page keeps this component when it moves to the previous or next
    // transaction, so a new hash has to start again from the first page.
    if (previousHash.current === transactionHash) return;
    previousHash.current = transactionHash;
    resetPagination();
  }, [resetPagination, transactionHash]);

  const stateClassName =
    variant === "activity" ? "glass-panel rounded-2xl p-6 text-sm" : "text-sm";
  const events = data?.events ?? [];
  const hasNext = Boolean(data?.next_cursor);
  let content;
  if (loading) {
    content = (
      <div className={`${stateClassName} text-muted-foreground`}>{echo("loading_events")}</div>
    );
  } else if (error || data?.error) {
    content = (
      <div className={`${stateClassName} text-destructive`}>
        {echo("failed_to_load_events_preview")}
      </div>
    );
  } else if (!events.length) {
    content = (
      <div className={`${stateClassName} text-muted-foreground`}>
        {echo("no_events_in_transaction")}
      </div>
    );
  } else {
    content =
      variant === "activity" ? <EventActivity events={events} /> : <EventSummary events={events} />;
  }

  // After the first page the controls stay while another page loads or fails, as in
  // the other tables. The reader can then always go back.
  return (
    <div className="grid gap-3">
      {content}
      {table.page > 1 || hasNext ? (
        <div className="flex justify-end">
          <TablePagination page={table.page} setPage={table.setPage} hasNext={hasNext} />
        </div>
      ) : null}
    </div>
  );
}
