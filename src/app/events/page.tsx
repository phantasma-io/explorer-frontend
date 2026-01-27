"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EventsTable } from "@/components/events-table";
import { ListSearch } from "@/components/list-search";
import { ComboSelect } from "@/components/ui/combo-select";
import { useEventKindOptions } from "@/lib/hooks/use-event-kind-options";
import { useEcho } from "@/lib/i18n/use-echo";

export default function EventsPage() {
  const { echo } = useEcho();
  const { options: eventKindOptions } = useEventKindOptions(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<string | undefined>(undefined);
  const [eventKind, setEventKind] = useState("");

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQuery(trimmed || undefined);
  };

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("events")}</h1>
            <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
              <div className="w-full md:w-72">
                <ListSearch
                  value={search}
                  onChange={setSearch}
                  onSubmit={applySearch}
                  placeholder={echo("search")}
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {echo("event_kind_short")}
                <ComboSelect
                  value={eventKind}
                  onChange={(value) => {
                    const nextValue = value === "__loading" || value === "__empty" ? "" : value;
                    setEventKind(nextValue);
                  }}
                  options={eventKindOptions}
                  triggerClassName="border-0 bg-transparent px-0 py-0 text-xs font-semibold uppercase tracking-[0.2em] text-foreground shadow-none"
                  contentClassName="min-w-[12rem]"
                />
              </div>
            </div>
          </div>
        </div>

        <EventsTable
          showSearch={false}
          showEventKindFilter={false}
          query={query}
          eventKind={eventKind}
        />
      </div>
    </AppShell>
  );
}
