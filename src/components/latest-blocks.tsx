"use client";

import Link from "next/link";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { BlockResults } from "@/lib/types/api";
import { formatDateTime, formatRelativeAge, unixToDate } from "@/lib/utils/time";
import { stringTruncateMiddle } from "@/lib/utils/format";
import { useEcho } from "@/lib/i18n/use-echo";

export function LatestBlocks() {
  const { echo } = useEcho();
  const { data } = useApi<BlockResults>(
    endpoints.blocks({ limit: 6, order_direction: "desc" }),
  );

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {echo("blocks")}
        </div>
        <Link
          href="/blocks"
          className="text-xs font-semibold uppercase tracking-[0.2em] link"
        >
          {echo("viewAll") ?? "View all"}
        </Link>
      </div>
      <div className="mt-4 grid gap-3">
        {(data?.blocks ?? []).map((block) => {
          const blockDate = block.date ? unixToDate(block.date) : null;
          return (
            <Link
              key={block.hash}
              href={`/block/${block.height}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm transition hover:border-primary"
            >
              <div>
                <div className="text-base font-semibold">#{block.height}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {stringTruncateMiddle(block.hash ?? "", 10, 8)}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{blockDate ? formatDateTime(blockDate) : "—"}</div>
                {blockDate ? (
                  <div className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatRelativeAge(blockDate)}
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
