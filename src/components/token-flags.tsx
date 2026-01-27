"use client";

import type { Token } from "@/lib/types/api";
import { useEcho } from "@/lib/i18n/use-echo";

interface TokenFlagsProps {
  token?: Token;
  variant?: "panel" | "inline";
  max?: number;
}

export function TokenFlags({ token, variant = "panel", max }: TokenFlagsProps) {
  const { echo } = useEcho();
  if (!token) return null;

  const flags = [
    { key: "fungible", label: echo("fungible"), value: token.fungible },
    { key: "transferable", label: echo("transferable"), value: token.transferable },
    { key: "finite", label: echo("finite"), value: token.finite },
    { key: "divisible", label: echo("divisible"), value: token.divisible },
    { key: "fuel", label: echo("fuel"), value: token.fuel },
    { key: "stakable", label: echo("stakable"), value: token.stakable },
    { key: "fiat", label: echo("fiat"), value: token.fiat },
    { key: "swappable", label: echo("swappable"), value: token.swappable },
    { key: "burnable", label: echo("burnable"), value: token.burnable },
  ].filter((item) => Boolean(item.value));

  if (!flags.length) return null;

  const visibleFlags = max ? flags.slice(0, max) : flags;
  const extraCount = max ? Math.max(0, flags.length - visibleFlags.length) : 0;

  const chips = (
    <div className="flex flex-wrap gap-2">
      {visibleFlags.map((flag) => (
        <span
          key={flag.key}
          className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
        >
          {flag.label}
        </span>
      ))}
      {extraCount > 0 ? (
        <span className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          +{extraCount}
        </span>
      ) : null}
    </div>
  );

  if (variant === "inline") {
    return chips;
  }

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        {echo("capabilities")}
      </div>
      <div className="mt-3">{chips}</div>
    </div>
  );
}
