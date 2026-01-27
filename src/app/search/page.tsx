"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { SearchResultsType } from "@/lib/types/api";
import { useEcho } from "@/lib/i18n/use-echo";

const resolveRoute = (endpoint: string, value: string) => {
  switch (endpoint) {
    case "tokens":
      return `/token/${value}`;
    case "contracts":
      return `/contract/${value}`;
    case "blocks":
      return `/block/${value}`;
    case "transactions":
      return `/tx/${value}`;
    case "events":
      return `/event/${value}`;
    case "nfts":
      return `/nft/${value}`;
    case "series":
      return `/series/${value}`;
    case "addresses":
    default:
      return `/address/${value}`;
  }
};

export default function SearchPage() {
  const { echo } = useEcho();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";

  const { data, loading, error } = useApi<SearchResultsType>(
    query ? endpoints.searches({ value: query }) : null,
  );

  const matches = useMemo(() => {
    return (data?.result ?? []).filter((item) => item.found);
  }, [data]);

  useEffect(() => {
    if (matches.length === 1) {
      const match = matches[0];
      const route = resolveRoute(match.endpoint_name, query);
      router.push(route);
    }
  }, [matches, query, router]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            {echo("search")}
          </div>
          <h1 className="mt-2 text-2xl font-semibold">{query || "—"}</h1>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && <div className="text-sm text-destructive">Failed to search.</div>}
          {!loading && !error && matches.length === 0 && (
            <div className="text-sm text-muted-foreground">No results.</div>
          )}
          <div className="grid gap-3">
            {matches.map((item) => {
              const route = resolveRoute(item.endpoint_name, query);
              return (
                <Link
                  key={item.endpoint_name}
                  href={route}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary"
                >
                  {query} ({item.endpoint_name})
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
