"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePersistentState } from "@/lib/hooks/use-persistent-state";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_ORDER_BY = "id";
const DEFAULT_ORDER_DIRECTION = "desc";

export function useTable() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = usePersistentState<number>(
    "pha-explorer-page-size",
    DEFAULT_PAGE_SIZE,
  );
  const [orderBy, setOrderBy] = useState(DEFAULT_ORDER_BY);
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">(
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

  useEffect(() => {
    resetPagination();
  }, [pageSize, resetPagination]);

  useEffect(() => {
    resetPagination();
  }, [orderBy, orderDirection, resetPagination]);

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

  return {
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
  };
}
