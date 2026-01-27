export const SUPPORTED_LOCALES = ["en", "de", "pt"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "pha-explorer-locale";

export const isLocale = (value: string | undefined | null): value is Locale =>
  Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));

export const normalizeLocale = (value: string | undefined | null): Locale =>
  isLocale(value) ? value : DEFAULT_LOCALE;

export const parseAcceptLanguage = (header: string | null): Locale => {
  if (!header) {
    return DEFAULT_LOCALE;
  }

  const candidates = header
    .split(",")
    .map((item) => item.split(";")[0]?.trim())
    .filter(Boolean)
    .map((lang) => lang.toLowerCase());

  for (const candidate of candidates) {
    const base = candidate.split("-")[0];
    if (isLocale(candidate)) return candidate as Locale;
    if (isLocale(base)) return base as Locale;
  }

  return DEFAULT_LOCALE;
};
