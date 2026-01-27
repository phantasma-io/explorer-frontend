"use client";

import { useCallback, useState } from "react";
import { postJson } from "@/lib/api/fetcher";

interface UsePostResult<Data, Body> {
  data: Data | null;
  error: unknown;
  loading: boolean;
  request: (overrideBody?: Body) => Promise<void>;
}

export function usePost<Data, Body>(url?: string | null, body?: Body): UsePostResult<Data, Body> {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    async (overrideBody?: Body) => {
      if (!url) return;
      setLoading(true);
      setError(null);
      try {
        // Accept optional overrides so callers can re-use the hook with different payloads.
        const response = await postJson<Data>(url, overrideBody ?? body ?? {});
        setData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [body, url],
  );

  return { data, error, loading, request };
}
