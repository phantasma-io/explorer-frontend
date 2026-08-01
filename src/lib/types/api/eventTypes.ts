import { EventKinds } from './eventkinds';
import { Address } from './addresses';
import { Chain } from './chains';
import { Token } from './tokens';
import { Fiat } from './fiat';
import { Dao } from './organizations';

export type EventTypes =
  | 'address_event'
  | 'chain_event'
  | 'gas_event'
  | 'governance_gas_config_event'
  | 'governance_chain_config_event'
  | 'special_resolution_event'
  | 'hash_event'
  | 'infusion_event'
  | 'market_event'
  | 'organization_event'
  | 'sale_event'
  | 'string_event'
  | 'token_create_event'
  | 'token_event'
  | 'token_series_event'
  | 'transaction_settle_event'
  | 'unknown_event';

export type EventTypeMap = {
  [key in EventKinds]: EventTypes | null;
};

export type ChainEvent = {
  name?: string;
  value?: string;
  chain?: Chain;
};

export type GasEvent = {
  price?: string;
  fee?: string;
  amount?: string;
  address?: Address;
};

export type GovernanceGasConfigEvent = {
  version?: string;
  max_name_length?: string;
  max_token_symbol_length?: string;
  fee_shift?: string;
  max_structure_size?: string;
  fee_multiplier?: string;
  gas_token_id?: string;
  data_token_id?: string;
  minimum_gas_offer?: string;
  data_escrow_per_row?: string;
  gas_fee_transfer?: string;
  gas_fee_query?: string;
  gas_fee_create_token_base?: string;
  gas_fee_create_token_symbol?: string;
  gas_fee_create_token_series?: string;
  gas_fee_per_byte?: string;
  gas_fee_register_name?: string;
  gas_burn_ratio_mul?: string;
  gas_burn_ratio_shift?: string;
};

export type GovernanceChainConfigEvent = {
  version?: string;
  reserved_1?: string;
  reserved_2?: string;
  reserved_3?: string;
  allowed_tx_types?: string;
  expiry_window?: string;
  block_rate_target?: string;
};

export type SpecialResolutionCall = {
  module_id?: number;
  module?: string;
  method_id?: number;
  method?: string;
  /**
   * Decoded call arguments. Absent in an event response — a repair resolution carries
   * tens of megabytes of them — and served by `/events/{id}/resolution-calls` instead;
   * `has_arguments` says whether there is anything to fetch.
   */
  arguments?: unknown;
  has_arguments?: boolean;
  calls?: SpecialResolutionCall[];
  /** Nested calls the event response did not inline. */
  calls_total?: number;
};

export type SpecialResolutionEvent = {
  resolution_id?: string;
  description?: string;
  /** Calls the resolution executed, before the event response capped the list. */
  calls_total?: number;
  calls?: SpecialResolutionCall[];
};

export type HashEvent = {
  hash?: string;
};

export type InfusionEvent = {
  token_id?: string;
  base_token?: Token;
  infused_token?: Token;
  infused_value?: string;
  infused_value_raw?: string;
};

export type MarketEvent = {
  base_token?: Token;
  quote_token?: Token;
  market_event_kind?: string;
  market_id?: string;
  price?: string;
  end_price?: string;
  fiat_price?: Fiat;
};

export type OrganizationEvent = {
  organization?: Dao;
  address?: Address;
};

export type SaleEvent = {
  hash?: string;
  sale_event_kind?: string;
};

export type StringEvent = {
  string_value?: string;
};

export type TokenEvent = {
  token?: Token;
  value?: string;
  value_raw?: string;
  chain_name?: string;
};

export type TokenCreateEvent = {
  token?: Token;
  max_supply?: string;
  decimals?: string;
  is_non_fungible?: boolean;
  carbon_token_id?: string;
  metadata?: Record<string, string>;
};

export type TokenSeriesEvent = {
  token?: Token;
  series_id?: string;
  max_mint?: string;
  max_supply?: string;
  owner?: Address;
  carbon_token_id?: string;
  carbon_series_id?: string;
  metadata?: Record<string, string>;
};

export type TransactionSettleEvent = {
  hash?: string;
  platform?: {
    name?: string;
    chain?: string;
  };
  chain?: string;
};

export type UnknownEvent = {
  payload_json?: string;
  raw_data?: string;
};

export type AddressEvent = {
  address: Address;
};

export interface EventData {
  address_event?: AddressEvent;
  chain_event?: ChainEvent;
  gas_event?: GasEvent;
  governance_gas_config_event?: GovernanceGasConfigEvent;
  governance_chain_config_event?: GovernanceChainConfigEvent;
  special_resolution_event?: SpecialResolutionEvent;
  hash_event?: HashEvent;
  infusion_event?: InfusionEvent;
  market_event?: MarketEvent;
  organization_event?: OrganizationEvent;
  sale_event?: SaleEvent;
  string_event?: StringEvent;
  token_create_event?: TokenCreateEvent;
  token_event?: TokenEvent;
  token_series_event?: TokenSeriesEvent;
  transaction_settle_event?: TransactionSettleEvent;
  unknown_event?: UnknownEvent;
}
