export type WithOption = 0 | 1;

export interface ListParams {
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
  cursor?: string;
  with_total?: WithOption;
  with_events?: WithOption;
  with_event_data?: WithOption;
}

export interface ListResults {
  total_results?: number;
  next_cursor?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}
