export interface OverviewStatsParams {
  chain?: string;
  include_burned?: 0 | 1;
  include_legacy_transactions?: 0 | 1;
}

export interface OverviewStatsResult {
  chain?: string;
  include_burned?: number;
  include_legacy_transactions?: number;
  transactions_total?: number;
  tokens_total?: number;
  nfts_total?: number;
  nfts_unburned_total?: number;
  nfts_burned_total?: number;
  contracts_total?: number;
  addresses_total?: number;
  soul_masters_total?: number;
}
