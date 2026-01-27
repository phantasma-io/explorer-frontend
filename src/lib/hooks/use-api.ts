import { useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { fetchJson } from "@/lib/api/fetcher";

export function useApi<Data>(url?: string | null, config?: SWRConfiguration<Data>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const shouldFetch = isClient && Boolean(url);
  const { data, error, isValidating, mutate } = useSWR<Data>(
    shouldFetch ? url : null,
    (endpoint: string) => fetchJson<Data>(endpoint),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: false,
      shouldRetryOnError: false,
      ...config,
    },
  );

  const loading = shouldFetch && !data && !error;

  return {
    data,
    error,
    loading,
    isValidating,
    mutate,
  };
}
