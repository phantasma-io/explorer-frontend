"use client";

import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";

export function Footer() {
  const { config } = useExplorerConfig();
  const showBuildStamp = config.buildStamp?.enabled && config.buildStamp.label;
  const buildStampValue = showBuildStamp
    ? [config.buildStamp.label, config.buildStamp.time].filter(Boolean).join(" · ")
    : "";

  return (
    <footer className="border-t border-border/60 bg-background/80 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-muted-foreground">
        <div>Phantasma Explorer · Built for the network</div>
        <div className="flex items-center gap-4">
          {showBuildStamp ? (
            <span className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {buildStampValue}
            </span>
          ) : null}
          <a
            href="https://phantasma.info"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            phantasma.info
          </a>
          <a
            href="https://github.com/phantasma-io"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
