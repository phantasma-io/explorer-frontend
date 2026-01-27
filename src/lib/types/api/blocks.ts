import { ListParams, ListResults, WithOption } from './list';
import { EventResult } from './events';

export interface Block {
  height?: string;
  reward?: string;
  hash?: string;
  previous_hash?: string;
  protocol?: number;
  chain_address?: string;
  validator_address?: string;
  date?: string;
  events?: EventResult[];
}

export interface BlockParams
  extends Pick<Block, 'hash' | 'height'>,
    ListParams {
  hash_partial?: string;
  with_fiat?: WithOption;
  with_nft?: WithOption;
  q?: string;
}

export interface BlockResults extends ListResults {
  blocks?: Block[];
}
