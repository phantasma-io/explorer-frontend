export interface NewAddressesDailyStat {
  date_unix_seconds?: number;
  new_addresses_count?: number;
  cumulative_addresses_count?: number;
}

export interface AddressStatsParams {
  chain?: string;
  daily_limit?: number;
}

export interface AddressStatsResult {
  chain?: string;
  daily_limit?: number;
  new_addresses_points_total?: number;
  first_new_addresses_date_unix_seconds?: number;
  latest_new_addresses_date_unix_seconds?: number;
  latest_new_addresses_count?: number;
  latest_cumulative_addresses_count?: number;
  new_addresses_daily?: NewAddressesDailyStat[];
}
