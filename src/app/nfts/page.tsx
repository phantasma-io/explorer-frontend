"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DataTable, Column } from "@/components/data-table";
import { ListSearch } from "@/components/list-search";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useTable } from "@/lib/hooks/use-table";
import type { Nft, NftResults } from "@/lib/types/api";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { CROWN_PREVIEW_IMAGE_URL, isCrownSymbol } from "@/lib/utils/crown-media";
import { useEcho } from "@/lib/i18n/use-echo";

export default function NftsPage() {
  const { echo } = useEcho();
  const table = useTable();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState<string | undefined>(undefined);

  const orderByParam = "mint_date";
  const { data, loading, error } = useApi<NftResults>(
    endpoints.nfts({
      limit: table.pageSize,
      cursor: table.cursor ?? undefined,
      order_by: orderByParam,
      order_direction: table.orderDirection,
      q,
    }),
  );

  useEffect(() => {
    table.onPageData(data?.next_cursor ?? null, data?.nfts?.length ?? 0);
  }, [table.onPageData, data?.next_cursor, data?.nfts?.length]);

  const applySearch = (value: string) => {
    const trimmed = value.trim();
    setSearch(trimmed);
    setQ(trimmed || undefined);
    table.resetPagination();
  };

  const columns = useMemo<Column<Nft>[]>(() => {
    return [
      {
        id: "asset",
        label: echo("image"),
        render: (row) => {
          const image = isCrownSymbol(row.symbol)
            ? CROWN_PREVIEW_IMAGE_URL
            : row.nft_metadata?.imageURL;
          return image ? (
            <img
              src={image}
              alt={row.nft_metadata?.name ?? "NFT"}
              className="h-10 w-10 rounded-xl border border-border/60 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              NFT
            </div>
          );
        },
      },
      {
        id: "name",
        label: echo("name"),
        render: (row) => (
          <Link href={`/nft/${row.token_id}`} className="link">
            {row.nft_metadata?.name ?? row.token_id}
          </Link>
        ),
      },
      {
        id: "symbol",
        label: echo("symbol"),
        render: (row) =>
          row.symbol ? (
            <Link href={`/token/${row.symbol}`} className="link">
              {row.symbol}
            </Link>
          ) : (
            "—"
          ),
      },
      {
        id: "mint",
        label: echo("mint_number"),
        render: (row) => {
          const mintNumber = row.nft_metadata?.mint_number;
          return !mintNumber || mintNumber === "0" ? "—" : mintNumber;
        },
      },
      {
        id: "owner",
        label: echo("owner"),
        render: (row) => {
          const owner = row.owners?.[0]?.address;
          return owner ? (
            <Link href={`/address/${owner}`} className="link">
              {stringTruncateMiddle(owner, 8, 6)}
            </Link>
          ) : (
            "—"
          );
        },
      },
      {
        id: "date",
        label: echo("mint_date"),
        render: (row) =>
          row.nft_metadata?.mint_date
            ? formatDateTime(unixToDate(row.nft_metadata.mint_date))
            : "—",
      },
    ];
  }, [echo]);

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">{echo("nfts")}</h1>
            <div className="w-full max-w-sm">
              <ListSearch
                value={search}
                onChange={setSearch}
                onSubmit={applySearch}
                placeholder={echo("search")}
              />
            </div>
          </div>
        </div>

        <DataTable
          tableId="PhantasmaExplorer-Nfts"
          columns={columns}
          rows={data?.nfts ?? []}
          raw={data?.nfts ?? []}
          loading={loading}
          error={Boolean(error || data?.error)}
          controls={{
            page: table.page,
            setPage: table.setPage,
            pageSize: table.pageSize,
            setPageSize: table.setPageSize,
            hasNext: table.hasNext,
            orderDirection: table.orderDirection,
            setOrderDirection: table.setOrderDirection,
          }}
        />
      </div>
    </AppShell>
  );
}
