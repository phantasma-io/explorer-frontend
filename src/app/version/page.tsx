"use client";

import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { TagChip } from "@/components/tag-chip";
import { TokenFlags } from "@/components/token-flags";
import { TxStateBadge } from "@/components/tx-state-badge";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { BUILD_GIT_SHA, BUILD_TIME } from "@/lib/build-info";

export default function VersionPage() {
  const { config } = useExplorerConfig();

  const rows = [
    { label: "Build time", value: BUILD_TIME },
    {
      label: "Git hash",
      value: (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono">{BUILD_GIT_SHA}</span>
          <CopyButton value={BUILD_GIT_SHA} />
        </span>
      ),
    },
    { label: "Build label", value: config.buildStamp.label || "—" },
    { label: "Build stamp enabled", value: config.buildStamp.enabled ? "true" : "false" },
    { label: "Nexus", value: config.nexus },
    { label: "API base URL", value: config.apiBaseUrl },
    { label: "Diagnostics enabled", value: config.diagnostics.enabled ? "true" : "false" },
  ];
  const tokenFlagsPreview = {
    fungible: true,
    transferable: true,
    finite: true,
    divisible: true,
    fuel: true,
    stakable: true,
    fiat: true,
    swappable: true,
    burnable: true,
  };

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            Version
          </div>
          <div className="mt-4 grid gap-3">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-wrap items-start justify-between gap-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {row.label}
                </div>
                <div className="text-sm text-foreground">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            Test tags:
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <TagChip label="Special Resolution" tone="sr" />
            <TagChip label="DEPLOY TOKEN" tone="deploy" />
            <TagChip label="CREATE SERIES" tone="series" />
            <TagChip label="MINT NFT" tone="mint" />
            <TagChip label="MINT FUNGIBLE" tone="mint" />
            <TagChip label="TRADE" tone="trade" />
            <TagChip label="STAKE" tone="stake" />
            <TagChip label="BURN" tone="burn" />
            <TagChip label="TRANSFER" tone="transfer" />
            <TagChip label="NFT" tone="nft" />
            <TagChip label="NFTS" tone="nft" />
            <TagChip label="FUNGIBLE" tone="fungible" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <TxStateBadge state="Halt" />
            <TxStateBadge state="Break" />
            <TxStateBadge state="Failed" />
            <TxStateBadge state="Pending" />
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Test flags:
            </div>
            <div className="mt-3">
              <TokenFlags token={tokenFlagsPreview} variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
