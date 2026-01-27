import { ListParams, ListResults } from './list';
import { InfusedInto, Infusion } from './infusions';
import { Series } from './series';
import { Contract } from './contracts';

export interface NftMetadata {
  description?: string;
  name?: string;
  imageURL?: string;
  videoURL?: string;
  infoURL?: string;
  rom?: string;
  ram?: string;
  mint_date?: string;
  mint_number?: string;
  metadata?: Record<string, string>;
}

export interface NftOwner {
  address?: string;
  onchain_name?: string;
  amount?: number;
}

export interface Nft {
  token_id?: string;
  chain?: string;
  symbol?: string;
  creator_address?: string;
  creator_onchain_name?: string;
  owners?: NftOwner[];
  contract?: Contract;
  nft_metadata?: NftMetadata;
  series?: Series;
  infusion?: Infusion[];
  infused_into?: InfusedInto;
}

export interface NftParams extends ListParams {
  fiat_currency?: string;
  creator?: string;
  owner?: string;
  contract_hash?: string;
  name?: string;
  q?: string;
  chain?: string;
  symbol?: string;
  token_id?: string;
  series_id?: string;
  status?: string;
}

export interface NftResults extends ListResults {
  nfts?: Nft[];
}
