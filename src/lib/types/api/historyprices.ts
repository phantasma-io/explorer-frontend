import { ListParams, ListResults, WithOption } from './list';
import { Token } from './tokens';

export type FiatCurrencies =
  | 'usd'
  | 'eur'
  | 'gbp'
  | 'jpy'
  | 'cad'
  | 'aud'
  | 'cny'
  | 'rub';

export type FiatPrice = {
  [x in FiatCurrencies]?: number;
};

export interface HistoryPrice extends FiatPrice {
  date?: string;
}

export interface TokenPrice {
  symbol?: string;
  price?: HistoryPrice;
  token?: Token;
}

export interface HistoryPriceParams extends ListParams {
  with_token?: WithOption;
  symbol: string;
  date_day?: string;
  date_less?: string;
  date_greater?: string;
}

export interface HistoryPriceResults extends ListResults {
  history_prices?: TokenPrice[];
}
