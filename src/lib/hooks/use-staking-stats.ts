"use client";

import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type {
  SoulMastersMonthlyStat,
  StakingDailyStat,
  StakingStatsResult,
} from "@/lib/types/api";

interface UseStakingStatsResult {
  loading: boolean;
  error: unknown;
  chain: string;
  daily: StakingDailyStat[];
  monthly: SoulMastersMonthlyStat[];
  latestDaily: StakingDailyStat | null;
  latestMonthly: SoulMastersMonthlyStat | null;
  dailyTotal: number;
  monthlyTotal: number;
  raw: StakingStatsResult | undefined;
}

export function useStakingStats(chain = "main"): UseStakingStatsResult {
  const { data, loading, error } = useApi<StakingStatsResult>(
    endpoints.stakingStats({
      chain,
      daily_limit: 0,
      monthly_limit: 0,
    }),
  );

  const daily = Array.isArray(data?.daily)
    ? data.daily.filter((item) => typeof item.date_unix_seconds === "number")
    : [];

  const monthly = Array.isArray(data?.monthly)
    ? data.monthly.filter((item) => typeof item.month_unix_seconds === "number")
    : [];

  return {
    loading,
    error,
    chain: data?.chain ?? chain,
    daily,
    monthly,
    latestDaily: daily.length ? daily[daily.length - 1] : null,
    latestMonthly: monthly.length ? monthly[monthly.length - 1] : null,
    dailyTotal: typeof data?.daily_points_total === "number" ? data.daily_points_total : daily.length,
    monthlyTotal: typeof data?.monthly_points_total === "number" ? data.monthly_points_total : monthly.length,
    raw: data,
  };
}
