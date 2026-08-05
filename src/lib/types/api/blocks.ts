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
  /** Gas-model-v2 fee-payout identity; absent on pre-v2 blocks. */
  producer_address?: string;
  date?: string;
  events?: EventResult[];
}

export interface BlockParams
  extends Pick<Block, 'hash' | 'height'>,
    ListParams {
  with_fiat?: WithOption;
  with_nft?: WithOption;
  q?: string;
}

export interface BlockResults extends ListResults {
  blocks?: Block[];
}
