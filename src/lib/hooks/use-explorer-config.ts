"use client";

import useSWR from "swr";
import {
  DEFAULT_EXPLORER_CONFIG,
  getExplorerConfig,
  type ExplorerConfig,
} from "@/lib/config";

interface UseExplorerConfigResult {
  config: ExplorerConfig;
  loading: boolean;
  error: unknown;
}

export function useExplorerConfig(): UseExplorerConfigResult {
  const { data, error } = useSWR("explorer-config", () => getExplorerConfig(), {
    revalidateOnFocus: false,
  });

  return {
    config: data ?? DEFAULT_EXPLORER_CONFIG,
    loading: !data && !error,
    error,
  };
}
