import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { NetworkSwitcher } from "@/components/network-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-6">
        <a
          href="/"
          className="flex items-center gap-4"
          aria-label="Phantasma Explorer home"
          title="Phantasma Explorer"
        >
          <span className="relative flex h-12 w-12 items-center justify-center">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-card/90 shadow-sm">
              <Image
                src="/brand/phantasma-icon.png"
                alt="Phantasma"
                width={34}
                height={34}
                priority
              />
            </span>
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Phantasma Network
            </div>
            <div className="text-lg font-semibold tracking-tight">Explorer</div>
          </div>
        </a>

        <div className="hidden flex-1 justify-center px-6 md:flex">
          <div className="w-full max-w-xl">
            <SearchInput />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          <a
            href="https://phantasma.info/blockchain/#wallets"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground transition hover:text-foreground"
            aria-label="Get wallet"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <div className="px-6 pb-4 md:hidden">
        <SearchInput />
      </div>
    </header>
  );
}
