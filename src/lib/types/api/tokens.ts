import { ListParams, ListResults, WithOption } from './list';

export type TokenLogosType = 'thumb' | 'small' | 'large';

export interface TokenLogo {
  type: TokenLogosType;
  url: string;
}

export interface Token {
  name?: string;
  symbol?: string;
  fungible?: boolean;
  transferable?: boolean;
  finite?: boolean;
  divisible?: boolean;
  fuel?: boolean;
  stakable?: boolean;
  fiat?: boolean;
  swappable?: boolean;
  burnable?: boolean;
  decimals?: number;
  current_supply?: string;
  max_supply?: string;
  burned_supply?: string;
  script_raw?: string;
  price?: { [x: string]: number };
  token_logos?: TokenLogo[];
}

export interface TokenParams extends ListParams {
  symbol?: string;
  q?: string;
  with_logo?: WithOption;
  with_price?: WithOption;
}

export interface TokenResults extends ListResults {
  tokens?: Token[];
}
