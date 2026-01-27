"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { I18nProvider } from "./i18n-provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, Locale, isLocale } from "./locales";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
});

interface LocaleProviderProps {
  initialLocale: Locale;
  children: React.ReactNode;
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LOCALE_COOKIE);
    if (stored && isLocale(stored) && stored !== locale) {
      setLocaleState(stored);
    }
    // Only run on mount to avoid ping-pong updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_COOKIE, locale);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000`;
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    if (next !== locale) {
      setLocaleState(next);
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
