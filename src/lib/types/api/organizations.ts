import { ListParams, ListResults, WithOption } from './list';
import { Address } from './addresses';
import { Contract } from './contracts';

export interface CreationEvent {
  address?: string;
  block_hash?: string;
  chain?: string;
  contract?: Contract;
  date?: string;
  event_id?: number;
  event_kind?: string;
  transaction_hash?: string;
}

export interface Dao {
  name?: string;
  size?: number;
  address?: Address;
  create_event?: CreationEvent;
}

export interface DaoParams extends ListParams {
  organization_name?: string;
  organization_name_partial?: string;
  q?: string;
  with_creation_event?: WithOption;
  with_address?: WithOption;
}

export interface DaoResults extends ListResults {
  organizations?: Dao[];
}
