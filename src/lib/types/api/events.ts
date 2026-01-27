import { ListParams, ListResults, WithOption } from './list';
import { Contract } from './contracts';
import { NftMetadata } from './nfts';
import { Series } from './series';
import { EventData } from './eventTypes';

export interface EventResult extends EventData {
  address_name?: string;
  address?: string;
  block_hash?: string;
  chain?: string;
  contract?: Contract;
  date?: string;
  event_id?: number;
  event_kind?: string;
  nft_metadata?: NftMetadata;
  series?: Series;
  token_id?: string;
  transaction_hash?: string;
  payload_json?: string;
  raw_data?: string;
}

export interface EventParams extends ListParams {
  address?: string;
  address_partial?: string;
  block_hash?: string;
  block_height?: string;
  chain?: string;
  contract?: string;
  date_day?: string;
  date_greater?: string;
  date_less?: string;
  event_id?: string;
  event_kind?: string;
  event_kind_partial?: string;
  nft_description_partial?: string;
  nft_name_partial?: string;
  q?: string;
  token_id?: string;
  transaction_hash?: string;
  with_blacklisted?: WithOption;
  with_event_data?: WithOption;
  with_fiat?: WithOption;
  with_metadata?: WithOption;
  with_nsfw?: WithOption;
  with_series?: WithOption;
}

export interface EventResults extends ListResults {
  events?: EventResult[];
}
