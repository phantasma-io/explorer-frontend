import { ListParams, ListResults, WithOption } from './list';
import { EventResult } from './events';
import { Address } from './addresses';
import { Token } from './tokens';

// The events of one kind and one token inside a transaction, counted and summed by
// the API over all of them (`with_summary=1`).
export interface TransactionSummaryRow {
  event_kind?: string;
  // Absent for events that carry no token.
  token?: Token;
  event_count?: number;
  // How many distinct addresses these events belong to.
  address_count?: number;
  // Present only when there is exactly one address.
  address?: Address;
  // How many of these events belong to the transaction sender.
  sender_event_count?: number;
  // Sums of the event values, formatted with the token decimals. Fungible tokens
  // only: for an NFT token `event_count` is the number of NFTs.
  amount?: string;
  amount_raw?: string;
  sender_amount?: string;
  sender_amount_raw?: string;
  // The first of these events, with its event data.
  first_event?: EventResult;
}

export interface Transaction {
  hash?: string;
  block_hash?: string;
  block_height?: string;
  chain?: string;
  previous_hash?: string;
  next_hash?: string;
  fee?: string;
  fee_raw?: string;
  gas_limit?: string;
  gas_limit_raw?: string;
  gas_price?: string;
  gas_price_raw?: string;
  gas_payer?: Address;
  gas_target?: Address;
  sender?: Address;
  result?: string;
  debug_comment?: string;
  payload?: string;
  state?: string;
  index?: number;
  date?: string;
  expiration?: string;
  events?: EventResult[];
  event_count?: number;
  summary?: TransactionSummaryRow[];
}

export interface TransactionParams extends ListParams {
  hash?: string;
  address?: string;
  block_height?: string;
  block_hash?: string;
  date_greater?: string;
  date_less?: string;
  q?: string;
  chain?: string;
  state?: string;
  with_fiat?: WithOption;
  with_nft?: WithOption;
  with_neighbors?: WithOption;
  with_script?: WithOption;
  with_summary?: WithOption;
}

export interface TransactionResults extends ListResults {
  transactions?: Transaction[];
}

export interface RejectedTransactionCandidate {
  hash?: string;
  nexus?: string;
  chain?: string;
  block_height?: string;
  block_hash?: string;
  date?: string;
  state?: string;
  result?: string;
  debug_comment?: string;
  payload?: string;
  script_raw?: string;
  fee_raw?: string;
  expiration?: string;
  gas_price_raw?: string;
  gas_limit_raw?: string;
  sender?: string;
  gas_payer?: string;
  gas_target?: string;
  canonical_status?: string;
  captured_at?: string;
  updated_at?: string;
  rpc_response_json?: string;
  block_response_json?: string;
}

export interface RejectedTransactionCandidateResults {
  rejected_transactions?: RejectedTransactionCandidate[];
  error?: string;
}
