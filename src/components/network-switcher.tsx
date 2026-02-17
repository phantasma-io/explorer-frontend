"use client";

import { DEFAULT_EXPLORER_CONFIG, NETWORKS, type NetworkKey } from "@/lib/config";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";

const NETWORK_LABELS: Record<NetworkKey, string> = {
  mainnet: "Mainnet",
  testnet: "Testnet",
  devnet: "Devnet",
};

export function NetworkSwitcher() {
  const { config, loading } = useExplorerConfig();
  // Avoid a mainnet flash before the runtime config loads by keeping buttons neutral.
  const active = loading ? null : (config.nexus ?? DEFAULT_EXPLORER_CONFIG.nexus);
  const explorers = config.explorers ?? DEFAULT_EXPLORER_CONFIG.explorers;

  const handleNavigate = (network: NetworkKey) => {
    const href = explorers[network] ?? DEFAULT_EXPLORER_CONFIG.explorers[network];
    if (typeof window !== "undefined") {
      window.location.assign(href);
    }
  };

  return (
    <div className="flex w-full rounded-full border border-border bg-card/85 p-1 text-sm md:w-auto">
      {NETWORKS.map((network) => {
        const isActive = active === network;
        return (
          <button
            key={network}
            type="button"
            onClick={() => handleNavigate(network)}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={isActive}
          >
            {NETWORK_LABELS[network]}
          </button>
        );
      })}
    </div>
  );
}
