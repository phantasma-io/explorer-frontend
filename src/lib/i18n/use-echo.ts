"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "./locale-context";

export function useEcho() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  const echo = useCallback(
    (key: string) => t(key, { defaultValue: key }),
    [t],
  );

  return {
    echo,
    locale,
    setLocale,
  };
}
