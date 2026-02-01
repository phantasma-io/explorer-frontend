import { objToQuery } from "@/lib/api/query";
import type { NetworkKey } from "@/lib/config";

type QueryRecord = Parameters<typeof objToQuery>[0];

// REST RPC base URLs per nexus (used for Raw panel API links).
const RPC_BASE_URLS: Record<NetworkKey, string> = {
  mainnet: "https://pharpc1.phantasma.info/api/v1",
  testnet: "https://testnet.phantasma.info/api/v1",
  devnet: "https://devnet.phantasma.info/api/v1",
};

const normalizeBase = (base: string) => base.replace(/\/+$/, "");
const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

export const getRpcBaseUrl = (nexus: NetworkKey) =>
  RPC_BASE_URLS[nexus] ?? RPC_BASE_URLS.mainnet;

export const buildRpcUrl = (
  nexus: NetworkKey,
  endpoint: string,
  params?: QueryRecord | null,
  rpcBaseUrl?: string | null,
) => {
  const override = typeof rpcBaseUrl === "string" ? rpcBaseUrl.trim() : "";
  const base = normalizeBase(override.length ? override : getRpcBaseUrl(nexus));
  const path = normalizePath(endpoint);
  const query = params ? objToQuery(params) : "";
  return `${base}${path}${query}`;
};

export const buildExplorerApiUrl = (apiBaseUrl: string, endpoint?: string | null) => {
  if (!endpoint) return null;
  const base = normalizeBase(apiBaseUrl);
  const path = normalizePath(endpoint);
  return `${base}${path}`;
};
