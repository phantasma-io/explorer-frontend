"use client";

import Link from "next/link";
import { ArrowUpRight, Blocks, CircleDollarSign, Coins, Hash, Layers } from "lucide-react";
import { useEcho } from "@/lib/i18n/use-echo";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { useOverviewStats } from "@/lib/hooks/use-overview-stats";
import { StatCard } from "@/components/stat-card";

export function HomeHero() {
  const { echo } = useEcho();
  const { config } = useExplorerConfig();
  const stats = useOverviewStats();
  const statusNetwork = config?.nexus ?? "mainnet";
  const statusLink = `https://status.phantasma.info/?network=${statusNetwork}`;
  const deployLinks: Record<string, string> = {
    mainnet: "https://deploy.phantasma.info/",
    testnet: "https://deploy-testnet.phantasma.info/",
    devnet: "https://deploy-devnet.phantasma.info/",
  };
  const deployLink = deployLinks[statusNetwork] ?? deployLinks.mainnet;

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
            Real-time visibility into blocks, transactions, tokens, and NFTs. Search, filter, and
            inspect the chain with a fast, modern interface.
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
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={statusLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              {echo("status")} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <a
              href={deployLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              {echo("deploy")} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label={echo("last_block")}
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
            label={echo("soul_circulation_supply")}
            value={stats.soulCirculationSupply ?? "—"}
            icon={<CircleDollarSign className="h-4 w-4" />}
          />
          <StatCard
            label={echo("kcal_circulation_supply")}
            value={stats.kcalCirculationSupply ?? "—"}
            icon={<CircleDollarSign className="h-4 w-4" />}
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
