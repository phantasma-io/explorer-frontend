"use client";

import { AppShell } from "@/components/app-shell";
import { EventsTable } from "@/components/events-table";
import { useEcho } from "@/lib/i18n/use-echo";

export default function EventsPage() {
  const { echo } = useEcho();

  return (
    <AppShell>
      <div className="grid gap-6">
        <EventsTable title={echo("events")} showEventKindFilter />
      </div>
    </AppShell>
  );
}
