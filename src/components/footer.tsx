"use client";

import Link from "next/link";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";

export function Footer() {
  const { config } = useExplorerConfig();
  const showBuildStamp = config.buildStamp?.enabled && config.buildStamp.label;
  const buildStampValue = showBuildStamp
    ? [config.buildStamp.label, config.buildStamp.time, config.buildStamp.hash]
        .filter(Boolean)
        .join(" · ")
    : "";
  const links = [
    { label: "phantasma.info", href: "https://phantasma.info" },
    { label: "GitBook", href: "https://phantasma.gitbook.io/" },
    { label: "CoinGecko", href: "https://www.coingecko.com/en/coins/phantasma" },
    { label: "CoinMarketCap", href: "https://coinmarketcap.com/currencies/phantasma" },
    { label: "Twitter", href: "https://twitter.com/phantasmachain" },
    { label: "Telegram", href: "https://t.me/phantasma_io" },
    { label: "Discord", href: "https://discord.com/invite/u7D74kH" },
    { label: "GitHub", href: "https://github.com/Phantasma-io" },
  ];

  return (
    <footer className="border-t border-border/60 bg-background/80 py-8">
      <div className="mx-auto w-full max-w-7xl px-6 text-xs text-muted-foreground">
        <div className="grid gap-4 md:grid-cols-[1fr_1.6fr] md:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <span>Phantasma Explorer · Built for the network</span>
            {showBuildStamp ? (
              <Link
                href="/version"
                className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {buildStampValue}
              </Link>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-4 md:justify-end">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
