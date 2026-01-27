import { ListResults } from './list';

export interface Chain {
  chain_name?: string;
  chain_height?: string;
}

export interface ChainParams {
  chain?: string;
}

export interface ChainResults extends ListResults {
  chains?: Chain[];
}
