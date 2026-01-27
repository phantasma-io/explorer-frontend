import { ListParams, ListResults } from './list';

export interface Series {
  id?: string;
  creator?: string;
  current_supply?: number;
  max_supply?: number;
  mode_name?: string;
  name?: string;
  description?: string;
  image?: string;
  royalties?: string;
  type?: number;
  attr_type_1?: string;
  attr_value_1?: string;
  attr_type_2?: string;
  attr_value_2?: string;
  attr_type_3?: string;
  attr_value_3?: string;
  metadata?: Record<string, string>;
}

export interface SeriesParams extends ListParams {
  id?: string;
  creator?: string;
  name?: string;
  q?: string;
  chain?: string;
  contract?: string;
  symbol?: string;
}

export interface SeriesResults extends ListResults {
  series?: Series[];
}
