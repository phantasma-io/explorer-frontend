"use client";

import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { TagChip } from "@/components/tag-chip";
import { TokenFlags } from "@/components/token-flags";
import { TxStateBadge } from "@/components/tx-state-badge";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { BUILD_GIT_SHA, BUILD_TIME } from "@/lib/build-info";
import { useEcho } from "@/lib/i18n/use-echo";

export default function VersionPage() {
  const { echo } = useEcho();
  const { config } = useExplorerConfig();

  const rows = [
    { label: echo("version_build_time"), value: BUILD_TIME },
    {
      label: echo("version_git_hash"),
      value: (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono">{BUILD_GIT_SHA}</span>
          <CopyButton value={BUILD_GIT_SHA} />
        </span>
      ),
    },
    { label: echo("version_build_label"), value: config.buildStamp.label || "—" },
    { label: echo("version_build_stamp_enabled"), value: config.buildStamp.enabled ? "true" : "false" },
    { label: echo("version_nexus"), value: config.nexus },
    { label: echo("version_api_base_url"), value: config.apiBaseUrl },
    { label: echo("version_diagnostics_enabled"), value: config.diagnostics.enabled ? "true" : "false" },
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
            {echo("version")}
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
            {echo("version_test_tags")}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <TagChip label={echo("tag_special_resolution")} tone="sr" />
            <TagChip label={echo("tag_deploy_token")} tone="deploy" />
            <TagChip label={echo("tag_create_series")} tone="series" />
            <TagChip label={echo("tag_mint_nft")} tone="mint" />
            <TagChip label={echo("tag_mint_fungible")} tone="mint" />
            <TagChip label={echo("tag_trade")} tone="trade" />
            <TagChip label={echo("tag_stake")} tone="stake" />
            <TagChip label={echo("tag_burn")} tone="burn" />
            <TagChip label={echo("tag_transfer")} tone="transfer" />
            <TagChip label={echo("nft")} tone="nft" />
            <TagChip label={echo("nfts")} tone="nft" />
            <TagChip label={echo("fungible")} tone="fungible" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <TxStateBadge state="Halt" />
            <TxStateBadge state="Break" />
            <TxStateBadge state="Failed" />
            <TxStateBadge state="Pending" />
          </div>
          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              {echo("version_test_flags")}
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
