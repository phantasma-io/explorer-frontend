"use client";

import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { AddressStatsResult, NewAddressesDailyStat } from "@/lib/types/api";

interface UseAddressStatsResult {
  loading: boolean;
  error: unknown;
  chain: string;
  newAddressesDaily: NewAddressesDailyStat[];
  latestDaily: NewAddressesDailyStat | null;
  dailyTotal: number;
  raw: AddressStatsResult | undefined;
}

export function useAddressStats(chain = "main"): UseAddressStatsResult {
  const { data, loading, error } = useApi<AddressStatsResult>(
    endpoints.addressStats({
      chain,
      daily_limit: 0,
    }),
  );

  const newAddressesDaily = Array.isArray(data?.new_addresses_daily)
    ? data.new_addresses_daily.filter((item) => typeof item.date_unix_seconds === "number")
    : [];

  return {
    loading,
    error,
    chain: data?.chain ?? chain,
    newAddressesDaily,
    latestDaily: newAddressesDaily.length ? newAddressesDaily[newAddressesDaily.length - 1] : null,
    dailyTotal:
      typeof data?.new_addresses_points_total === "number"
        ? data.new_addresses_points_total
        : newAddressesDaily.length,
    raw: data,
  };
}
