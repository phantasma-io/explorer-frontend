"use client";

import React, { ReactNode, useMemo } from "react";
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
  const i18n = useMemo(() => {
    const instance = createInstance();
    instance
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
    return instance;
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
