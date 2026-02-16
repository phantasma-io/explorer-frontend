import { useMemo } from "react";
import type { ComboOption } from "@/components/ui/combo-select";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { EventKindResults } from "@/lib/types/api";
import { useEcho } from "@/lib/i18n/use-echo";

interface EventKindOptionsResult {
  options: ComboOption[];
  loading: boolean;
  kinds: string[];
}

export function useEventKindOptions(enabled: boolean, chain = ""): EventKindOptionsResult {
  const { echo } = useEcho();
  const { data, loading } = useApi<EventKindResults>(
    enabled
      ? endpoints.eventKindsWithEvents({
          chain: chain || undefined,
        })
      : null,
  );

  const kinds = useMemo(
    () =>
      (data?.event_kinds || [])
        .map((item) => item.name)
        .filter((item): item is string => Boolean(item)),
    [data],
  );

  const options = useMemo<ComboOption[]>(() => {
    const base: ComboOption[] = [{ value: "", label: echo("all") }];
    if (!enabled) {
      return base;
    }
    if (loading) {
      return [...base, { value: "__loading", label: echo("loading"), disabled: true }];
    }
    if (!kinds.length) {
      return [...base, { value: "__empty", label: echo("no-results"), disabled: true }];
    }
    return [
      ...base,
      ...kinds.map((item) => ({
        value: item,
        label: item,
      })),
    ];
  }, [echo, enabled, kinds, loading]);

  return { options, loading, kinds };
}
