type LegacyRedirectTarget = {
  pathname: string;
  search: string;
};

const LEGACY_LOCALES = new Set(["en", "de", "pt"]);

type QueryMapping = {
  targetPrefix: string;
  queryKeys: string[];
};

const QUERY_BASED_MAPPINGS: Record<string, QueryMapping> = {
  address: { targetPrefix: "/address", queryKeys: ["id", "address"] },
  block: { targetPrefix: "/block", queryKeys: ["id", "height", "hash"] },
  contract: { targetPrefix: "/contract", queryKeys: ["id", "hash", "contract"] },
  dao: { targetPrefix: "/dao", queryKeys: ["id", "name", "dao"] },
  event: { targetPrefix: "/event", queryKeys: ["id", "event_id"] },
  nft: { targetPrefix: "/nft", queryKeys: ["id", "token_id", "nft"] },
  series: { targetPrefix: "/series", queryKeys: ["id", "series_id"] },
  token: { targetPrefix: "/token", queryKeys: ["id", "symbol"] },
  transaction: { targetPrefix: "/tx", queryKeys: ["id", "hash", "tx"] },
};

const findFirstNonEmpty = (searchParams: URLSearchParams, keys: string[]) => {
  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }
  return null;
};

const stripQueryKeys = (searchParams: URLSearchParams, keysToStrip: string[]) => {
  const strip = new Set(keysToStrip);
  const next = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (strip.has(key)) return;
    next.append(key, value);
  });
  const query = next.toString();
  return query ? `?${query}` : "";
};

const buildSegmentPath = (segments: string[]) => (segments.length ? `/${segments.join("/")}` : "/");

export const resolveLegacyRedirect = (url: URL): LegacyRedirectTarget | null => {
  const originalSegments = url.pathname.split("/").filter(Boolean);
  if (originalSegments.length === 0) return null;

  const firstSegment = originalSegments[0]?.toLowerCase() ?? "";
  const hasLegacyLocale = LEGACY_LOCALES.has(firstSegment);
  const segments = hasLegacyLocale ? originalSegments.slice(1) : originalSegments;

  // `/en`/`/de`/`/pt` root links should map to the locale-less home page.
  if (hasLegacyLocale && segments.length === 0) {
    return { pathname: "/", search: url.search };
  }

  if (segments.length === 0) return null;

  const [routeRaw, ...tail] = segments;
  const route = routeRaw.toLowerCase();

  // Old transaction links may use `/transaction/<hash>`; map directly to `/tx/<hash>`.
  if (route === "transaction" && tail.length > 0) {
    return { pathname: `/tx/${tail[0]}`, search: url.search };
  }

  // Old links commonly used query IDs like `/token?id=SOUL` or `/en/token?id=SOUL`.
  if (tail.length === 0) {
    const mapping = QUERY_BASED_MAPPINGS[route];
    if (mapping) {
      const legacyId = findFirstNonEmpty(url.searchParams, mapping.queryKeys);
      if (legacyId) {
        return {
          pathname: `${mapping.targetPrefix}/${legacyId}`,
          search: stripQueryKeys(url.searchParams, mapping.queryKeys),
        };
      }
    }
  }

  // For locale-prefixed links in old format, strip locale and keep path/query.
  if (hasLegacyLocale) {
    return { pathname: buildSegmentPath(segments), search: url.search };
  }

  return null;
};

