import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, Locale, isLocale, parseAcceptLanguage } from "./locales";

export const resolveLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) {
    return stored;
  }

  const headerList = await headers();
  const headerLocale = parseAcceptLanguage(headerList.get("accept-language"));
  return headerLocale ?? DEFAULT_LOCALE;
};
