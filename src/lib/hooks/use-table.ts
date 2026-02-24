"use client";

import { useCallback, useMemo, useState } from "react";
import { usePersistentState } from "@/lib/hooks/use-persistent-state";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_ORDER_BY = "id";
const DEFAULT_ORDER_DIRECTION = "desc";

export function useTable() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setStoredPageSize] = usePersistentState<number>(
    "pha-explorer-page-size",
    DEFAULT_PAGE_SIZE,
  );
  const [orderBy, setOrderByState] = useState(DEFAULT_ORDER_BY);
  const [orderDirection, setOrderDirectionState] = useState<"asc" | "desc">(
    DEFAULT_ORDER_DIRECTION,
  );
  const [hasNext, setHasNext] = useState(true);
  const [cursors, setCursors] = useState<Record<number, string | null>>({ 1: null });

  const cursor = useMemo(() => {
    return cursors[page] ?? null;
  }, [cursors, page]);

  const resetPagination = useCallback(() => {
    setPage(1);
    setCursors({ 1: null });
    setHasNext(true);
  }, []);

  const setPageSize = useCallback(
    (size: number) => {
      setStoredPageSize(size);
      resetPagination();
    },
    [resetPagination, setStoredPageSize],
  );

  const setOrderBy = useCallback(
    (value: string) => {
      setOrderByState(value);
      resetPagination();
    },
    [resetPagination],
  );

  const setOrderDirection = useCallback(
    (value: "asc" | "desc") => {
      setOrderDirectionState(value);
      resetPagination();
    },
    [resetPagination],
  );

  const onPageData = useCallback(
    (nextCursor: string | null | undefined, _receivedCount: number) => {
      void _receivedCount;
      setCursors((prev) => {
        const next = { ...prev, [page + 1]: nextCursor ?? null };
        Object.keys(next).forEach((key) => {
          const keyNum = Number(key);
          if (Number.isFinite(keyNum) && keyNum > page + 1) {
            delete next[keyNum];
          }
        });
        return next;
      });
      setHasNext(Boolean(nextCursor));
    },
    [page],
  );

  return useMemo(
    () => ({
      page,
      setPage,
      pageSize,
      setPageSize,
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      hasNext,
      cursor,
      resetPagination,
      onPageData,
    }),
    [
      page,
      pageSize,
      orderBy,
      orderDirection,
      hasNext,
      cursor,
      setPageSize,
      setOrderBy,
      setOrderDirection,
      resetPagination,
      onPageData,
    ],
  );
}
