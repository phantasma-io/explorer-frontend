"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { Locale } from "@/lib/i18n/locales";
import { Diagnostics } from "@/components/diagnostics";

interface ProvidersProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function Providers({ initialLocale, children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <LocaleProvider initialLocale={initialLocale}>
        <Diagnostics />
        {children}
      </LocaleProvider>
    </ThemeProvider>
  );
}
