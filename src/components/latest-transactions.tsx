"use client";

import Link from "next/link";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { TransactionResults } from "@/lib/types/api";
import { formatDateTime, formatRelativeAge, unixToDate } from "@/lib/utils/time";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

export function LatestTransactions() {
  const { echo } = useEcho();
  const { data } = useApi<TransactionResults>(
    endpoints.transactions({ chain: "main", limit: 6, order_direction: "desc" }),
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
        {(data?.transactions ?? []).map((tx) => {
          const txDate = tx.date ? unixToDate(tx.date) : null;
          return (
            <Link
              key={tx.hash}
              href={`/tx/${tx.hash}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary"
            >
              <div>
                <div className="text-base font-semibold">
                  {stringTruncateMiddle(tx.hash ?? "", 12, 10)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {echo("block")}: {tx.block_height}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{txDate ? formatDateTime(txDate) : "—"}</div>
                {txDate ? (
                  <div className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatRelativeAge(txDate)}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
