"use client";

import { Globe } from "lucide-react";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/locale-context";
import { ComboSelect } from "@/components/ui/combo-select";

const LABELS: Record<string, string> = {
  en: "EN",
  de: "DE",
  pt: "PT",
};

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <ComboSelect
        value={locale}
        onChange={(value) => setLocale(value as typeof locale)}
        options={SUPPORTED_LOCALES.map((value) => ({
          value,
          label: LABELS[value] ?? value,
        }))}
        ariaLabel="Select language"
        triggerClassName="border-0 bg-transparent px-0 py-0 text-xs font-semibold uppercase tracking-[0.18em] text-foreground shadow-none"
        contentClassName="min-w-[7rem]"
      />
    </div>
  );
}
