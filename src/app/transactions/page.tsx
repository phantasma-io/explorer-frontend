"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ListSearch } from "@/components/list-search";
import { TransactionsTable } from "@/components/transactions-table";
import { useEcho } from "@/lib/i18n/use-echo";

export default function TransactionsPage() {
  const { echo } = useEcho();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<string | undefined>(undefined);

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
            <h1 className="text-2xl font-semibold">{echo("transactions")}</h1>
            <div className="w-full max-w-sm">
              <ListSearch
                value={search}
                onChange={setSearch}
                onSubmit={applySearch}
                placeholder={echo("search")}
              />
            </div>
          </div>
        </div>

        <TransactionsTable showSearch={false} query={query} />
      </div>
    </AppShell>
  );
}
