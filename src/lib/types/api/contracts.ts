import { ListParams, ListResults, WithOption } from './list';
import { Address } from './addresses';
import { Token } from './tokens';

export interface ContractMethod {
  name?: string;
  parameters?: unknown[];
}

export interface Contract {
  name?: string;
  hash?: string;
  symbol?: string;
  compiler?: string;
  create_date?: string;
  type?: string;
  address?: Address;
  script_raw?: string;
  token?: Token;
  methods?: ContractMethod[];
}

export interface ContractParams
  extends ListParams,
    Pick<Contract, 'symbol' | 'hash'> {
  q?: string;
  with_methods?: WithOption;
  with_script?: WithOption;
  with_token?: WithOption;
  with_creation_event?: WithOption;
}

export interface ContractResults extends ListResults {
  contracts?: Contract[];
}
