"use client";

import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
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
      </div>
    </AppShell>
  );
}
