export interface Search {
  endpoint_name: string;
  endpoint_parameter: string;
  found: boolean;
}

export interface SearchParams {
  value: string;
}

export interface SearchResultsType {
  result?: Search[];
}
