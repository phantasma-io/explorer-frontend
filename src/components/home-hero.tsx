"use client";

import Link from "next/link";
import { ArrowUpRight, Blocks, Coins, Hash, Layers } from "lucide-react";
import { useEcho } from "@/lib/i18n/use-echo";
import { useOverviewStats } from "@/lib/hooks/use-overview-stats";
import { StatCard } from "@/components/stat-card";

export function HomeHero() {
  const { echo } = useEcho();
  const stats = useOverviewStats();

  return (
    <section className="grid gap-10">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel relative overflow-hidden rounded-3xl p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            {echo("meta-title")}
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            Phantasma Explorer
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Live, human-readable insight into blocks, transactions, tokens, and NFTs. Search, filter,
            and inspect the chain with a modern UI built for speed.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-sm"
            >
              {echo("transactions")} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/blocks"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              {echo("blocks")} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/tokens"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              {echo("tokens")} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/nfts"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              {echo("nfts")} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <StatCard
            label={echo("block")}
            value={stats.latestBlockHeight ?? "—"}
            meta={stats.latestBlockTime ?? ""}
            icon={<Blocks className="h-4 w-4" />}
          />
          <StatCard
            label={echo("transactions")}
            value={stats.totalTransactions ?? "—"}
            meta={stats.latestTxHash ?? ""}
            icon={<Hash className="h-4 w-4" />}
          />
          <StatCard
            label={echo("tokens")}
            value={stats.totalTokens ?? "—"}
            meta={stats.totalContracts ? `${stats.totalContracts} contracts` : ""}
            icon={<Coins className="h-4 w-4" />}
          />
          <StatCard
            label={echo("nfts")}
            value={stats.totalNfts ?? "—"}
            meta={stats.totalAddresses ? `${stats.totalAddresses} addresses` : ""}
            icon={<Layers className="h-4 w-4" />}
          />
        </div>
      </div>
    </section>
  );
}
