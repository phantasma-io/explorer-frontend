"use client";

import type { Token } from "@/lib/types/api";
import { getTokenLogo } from "@/lib/utils/token";

interface TokenMarkProps {
  token?: Token | null;
  symbol?: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<TokenMarkProps["size"]>, string> = {
  sm: "h-9 w-9 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
};

export function TokenMark({ token, symbol, size = "sm", className }: TokenMarkProps) {
  const tokenSymbol = (symbol ?? token?.symbol ?? "").toUpperCase();
  const logoUrl = getTokenLogo(
    token?.token_logos,
    size === "md" ? ["large", "small", "thumb"] : ["small", "thumb", "large"],
  );

  const fallback = tokenSymbol ? tokenSymbol.slice(0, 3) : "TOK";
  const baseClasses = `flex items-center justify-center border border-border/70 bg-card/85 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground ${SIZE_CLASSES[size]}`;
  const wrapperClass = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <div className={wrapperClass}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${tokenSymbol || "Token"} logo`}
          className="h-full w-full rounded-[inherit] object-cover"
          loading="lazy"
        />
      ) : (
        // Use a short symbol fallback so tokens without logos remain recognizable.
        <span>{fallback}</span>
      )}
    </div>
  );
}
