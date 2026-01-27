"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePersistentState } from "@/lib/hooks/use-persistent-state";

export type PaginationMode = "cursor" | "offset";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_ORDER_BY = "id";
const DEFAULT_ORDER_DIRECTION = "desc";

export function useTable(mode: PaginationMode = "offset") {
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
    if (mode !== "cursor") return undefined;
    return cursors[page] ?? null;
  }, [cursors, mode, page]);

  const offset = useMemo(() => {
    if (mode !== "offset") return 0;
    return (page - 1) * pageSize;
  }, [mode, page, pageSize]);

  const resetPagination = useCallback(() => {
    setPage(1);
    setCursors({ 1: null });
    setHasNext(true);
  }, []);

  useEffect(() => {
    resetPagination();
  }, [pageSize, mode, resetPagination]);

  useEffect(() => {
    resetPagination();
  }, [orderBy, orderDirection, resetPagination]);

  const onPageData = useCallback(
    (nextCursor: string | null | undefined, receivedCount: number) => {
      if (mode === "cursor") {
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
      } else {
        setHasNext(receivedCount >= pageSize);
      }
    },
    [mode, page, pageSize],
  );

  return {
    mode,
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
    offset,
    resetPagination,
    onPageData,
  };
}
