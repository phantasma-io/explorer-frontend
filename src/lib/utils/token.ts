import type { TokenLogo, TokenLogosType } from "@/lib/types/api";
import { formatNumberString } from "@/lib/utils/format";

export const getTokenPrice = (price?: Record<string, number>) => {
  if (!price) return null;
  const entries = Object.entries(price);
  if (!entries.length) return null;
  const preferred =
    entries.find(([key]) => key.toLowerCase() === "usd") ??
    entries.find(([key]) => key.toLowerCase() === "usdt") ??
    entries[0];
  return preferred ? { currency: preferred[0], value: preferred[1] } : null;
};

export const getTokenLogo = (
  logos?: TokenLogo[],
  preferred: TokenLogosType[] = ["small", "thumb", "large"],
) => {
  if (!logos?.length) return undefined;
  // Prefer predictable logo sizes first so token rows stay visually consistent.
  for (const type of preferred) {
    const match = logos.find((logo) => logo.type === type && logo.url);
    if (match?.url) return match.url;
  }
  return logos.find((logo) => logo.url)?.url;
};

export const formatTokenMaxSupply = (
  maxSupply?: string,
  finite?: boolean,
) => {
  if (finite === false) {
    return "∞";
  }

  const normalized = maxSupply?.trim();
  if (!normalized) {
    return "—";
  }

  return formatNumberString(normalized);
};
