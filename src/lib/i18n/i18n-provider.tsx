"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { createInstance, Resource } from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import { resources } from "./resources";
import { DEFAULT_LOCALE, Locale } from "./locales";

const i18nResources: Resource = resources;

interface I18nProviderProps {
  locale: Locale;
  children: ReactNode;
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const i18nRef = useRef(createInstance());

  if (!i18nRef.current.isInitialized) {
    i18nRef.current
      .use(initReactI18next)
      .init({
        resources: i18nResources,
        lng: locale,
        fallbackLng: DEFAULT_LOCALE,
        interpolation: { escapeValue: false },
        initImmediate: false,
        returnEmptyString: false,
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    if (!i18nRef.current.isInitialized) return;
    if (i18nRef.current.language === locale) return;
    i18nRef.current.changeLanguage(locale).catch(() => undefined);
  }, [locale]);

  return <I18nextProvider i18n={i18nRef.current}>{children}</I18nextProvider>;
}
