import { ListParams, ListResults } from './list';

export interface Oracle {
  url?: string;
  content?: string;
}

export interface OracleParams extends ListParams {
  block_hash?: string;
  block_height?: string;
}

export interface OracleResults extends ListResults {
  oracles?: Oracle[];
}
