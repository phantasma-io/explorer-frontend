"use client";

import type { ReactNode } from "react";
import type { VmValue } from "@/lib/types/api";

interface VmValueViewProps {
  value: VmValue;
}

/**
 * Renders a chain value in its real shape.
 *
 * Property values are VM values: a scalar, an array, or a struct, recursively. Printing a
 * struct as `JSON.stringify` output would hand the reader a blob for exactly the values
 * that carry the most meaning — a token's inflation targets, an NFT's attribute groups —
 * so an array becomes an ordered list and a struct becomes a field list, nested as deep as
 * the value goes. Scalars stay text: they are decimal strings for big integers and hex for
 * byte values, and reformatting them would lose precision.
 */
export function VmValueView({ value }: VmValueViewProps): ReactNode {
  if (typeof value === "string") {
    return <span className="break-all">{value === "" ? "—" : value}</span>;
  }

  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-muted-foreground">—</span>;
    return (
      <ol className="grid gap-2">
        {value.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {index + 1}.
            </span>
            <div className="min-w-0 flex-1">
              <VmValueView value={item} />
            </div>
          </li>
        ))}
      </ol>
    );
  }

  const entries = Object.entries(value);
  if (!entries.length) return <span className="text-muted-foreground">—</span>;

  return (
    <dl className="grid gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
      {entries.map(([field, fieldValue]) => (
        <div key={field} className="grid gap-1 md:grid-cols-[minmax(0,10rem)_1fr] md:gap-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {field}
          </dt>
          <dd className="min-w-0 text-sm text-foreground">
            <VmValueView value={fieldValue} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
