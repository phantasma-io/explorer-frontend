export const NETWORKS = ["mainnet", "testnet", "devnet"] as const;
export type NetworkKey = (typeof NETWORKS)[number];

export interface ExplorerConfig {
  nexus: NetworkKey;
  apiBaseUrl: string;
  explorers: Record<NetworkKey, string>;
  buildStamp: {
    enabled: boolean;
    label: string;
    time: string;
  };
  diagnostics: {
    enabled: boolean;
  };
}

export const DEFAULT_EXPLORER_CONFIG: ExplorerConfig = {
  nexus: "mainnet",
  apiBaseUrl: "https://api-explorer.phantasma.info/api/v1",
  explorers: {
    mainnet: "https://explorer.phantasma.info",
    testnet: "https://testnet-explorer.phantasma.info",
    devnet: "https://devnet-explorer.phantasma.info",
  },
  buildStamp: {
    enabled: false,
    label: "",
    time: "",
  },
  diagnostics: {
    enabled: false,
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeNetwork = (value: unknown): NetworkKey => {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (NETWORKS.includes(normalized as NetworkKey)) {
      return normalized as NetworkKey;
    }
  }
  return DEFAULT_EXPLORER_CONFIG.nexus;
};

const resolveString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim().length ? value : fallback;

export function parseExplorerConfig(payload: unknown): ExplorerConfig {
  if (!isRecord(payload)) {
    return DEFAULT_EXPLORER_CONFIG;
  }

  const nexus = normalizeNetwork(payload.nexus);
  const apiBaseUrl = resolveString(payload.apiBaseUrl, DEFAULT_EXPLORER_CONFIG.apiBaseUrl);

  const explorersRaw = isRecord(payload.explorers) ? payload.explorers : {};
  const explorers: Record<NetworkKey, string> = {
    mainnet: resolveString(explorersRaw.mainnet, DEFAULT_EXPLORER_CONFIG.explorers.mainnet),
    testnet: resolveString(explorersRaw.testnet, DEFAULT_EXPLORER_CONFIG.explorers.testnet),
    devnet: resolveString(explorersRaw.devnet, DEFAULT_EXPLORER_CONFIG.explorers.devnet),
  };

  const buildStampRaw = isRecord(payload.buildStamp) ? payload.buildStamp : {};
  const buildStamp = {
    enabled: Boolean(buildStampRaw.enabled),
    label: resolveString(buildStampRaw.label, DEFAULT_EXPLORER_CONFIG.buildStamp.label),
    time: resolveString(buildStampRaw.time, DEFAULT_EXPLORER_CONFIG.buildStamp.time),
  };

  const diagnosticsRaw = isRecord(payload.diagnostics) ? payload.diagnostics : {};
  const diagnostics = {
    enabled: Boolean(diagnosticsRaw.enabled),
  };

  return {
    nexus,
    apiBaseUrl,
    explorers,
    buildStamp,
    diagnostics,
  };
}

let cachedConfig: ExplorerConfig | null = null;
let inflight: Promise<ExplorerConfig> | null = null;

export async function loadExplorerConfig(configUrl = "/config.json"): Promise<ExplorerConfig> {
  const response = await fetch(configUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load config (${response.status})`);
  }
  const payload = (await response.json()) as unknown;
  return parseExplorerConfig(payload);
}

export async function getExplorerConfig(): Promise<ExplorerConfig> {
  if (typeof window === "undefined") {
    return DEFAULT_EXPLORER_CONFIG;
  }
  if (cachedConfig) return cachedConfig;
  if (!inflight) {
    inflight = loadExplorerConfig()
      .then((config) => {
        cachedConfig = config;
        return config;
      })
      .catch(() => {
        cachedConfig = DEFAULT_EXPLORER_CONFIG;
        return DEFAULT_EXPLORER_CONFIG;
      });
  }
  return inflight;
}
