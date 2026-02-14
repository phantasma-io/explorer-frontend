export interface StakingDailyStat {
  date_unix_seconds?: number;
  staked_soul_raw?: string;
  soul_supply_raw?: string;
  stakers_count?: number;
  masters_count?: number;
  staking_ratio?: number;
  staking_percent?: number;
  captured_at_unix_seconds?: number;
  source?: string;
}

export interface SoulMastersMonthlyStat {
  month_unix_seconds?: number;
  masters_count?: number;
  captured_at_unix_seconds?: number;
  source?: string;
}

export interface StakingStatsParams {
  chain?: string;
  daily_limit?: number;
  monthly_limit?: number;
}

export interface StakingStatsResult {
  chain?: string;
  daily_limit?: number;
  monthly_limit?: number;
  daily_points_total?: number;
  monthly_points_total?: number;
  first_daily_date_unix_seconds?: number;
  latest_daily_date_unix_seconds?: number;
  first_month_unix_seconds?: number;
  latest_month_unix_seconds?: number;
  latest_staking_ratio?: number;
  latest_staking_percent?: number;
  latest_staked_soul_raw?: string;
  latest_soul_supply_raw?: string;
  latest_stakers_count?: number;
  latest_masters_count?: number;
  daily?: StakingDailyStat[];
  monthly?: SoulMastersMonthlyStat[];
}
