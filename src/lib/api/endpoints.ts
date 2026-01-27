import { objToQuery } from "./query";

export const endpoints = {
  blocks: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/blocks${params ? objToQuery(params) : ""}`,
  addresses: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/addresses${params ? objToQuery(params) : ""}`,
  contracts: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/contracts${params ? objToQuery(params) : ""}`,
  instructions: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/instructions${params ? objToQuery(params) : ""}`,
  eventKindsWithEvents: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/eventKindsWithEvents${params ? objToQuery(params) : ""}`,
  events: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/events${params ? objToQuery(params) : ""}`,
  nfts: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/nfts${params ? objToQuery(params) : ""}`,
  organizations: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/organizations${params ? objToQuery(params) : ""}`,
  series: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/series${params ? objToQuery(params) : ""}`,
  searches: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/searches${params ? objToQuery(params) : ""}`,
  tokens: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/tokens${params ? objToQuery(params) : ""}`,
  transactions: (params?: Record<string, string | number | boolean | undefined | null>) =>
    `/transactions${params ? objToQuery(params) : ""}`,
};
