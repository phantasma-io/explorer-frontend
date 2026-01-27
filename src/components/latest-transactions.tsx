"use client";

import Link from "next/link";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { TransactionResults } from "@/lib/types/api";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

export function LatestTransactions() {
  const { echo } = useEcho();
  const { data } = useApi<TransactionResults>(
    endpoints.transactions({ limit: 6, order_direction: "desc" }),
  );

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {echo("transactions")}
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold uppercase tracking-[0.2em] link"
        >
          {echo("viewAll") ?? "View all"}
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {(data?.transactions ?? []).map((tx) => (
          <Link
            key={tx.hash}
            href={`/tx/${tx.hash}`}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary"
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {echo("hash")}
              </div>
              <div className="mt-1 text-base font-semibold">
                {stringTruncateMiddle(tx.hash ?? "", 12, 10)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {echo("block")}: {tx.block_height}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {tx.date ? formatDateTime(unixToDate(tx.date)) : "—"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
