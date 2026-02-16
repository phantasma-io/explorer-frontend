"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { HoldersTable } from "@/components/holders-table";
import { InstructionsPanel } from "@/components/instructions-panel";
import { NotFoundPanel } from "@/components/not-found-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { ScriptPanel } from "@/components/script-panel";
import { TokenMark } from "@/components/token-mark";
import { TokenFlags } from "@/components/token-flags";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { isNotFoundError } from "@/lib/api/fetcher";
import { useApi } from "@/lib/hooks/use-api";
import { useExplorerConfig } from "@/lib/hooks/use-explorer-config";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { TokenResults } from "@/lib/types/api";
import { numberFormat } from "@/lib/utils/format";
import { buildExplorerApiUrl, buildRpcUrl } from "@/lib/utils/api-links";
import { getTokenPrice } from "@/lib/utils/token";
import { useEcho } from "@/lib/i18n/use-echo";

export default function TokenPage() {
  const { echo } = useEcho();
  const { config } = useExplorerConfig();
  const symbolParam = useRouteParam("symbol");
  const tokenEndpoint = symbolParam
    ? endpoints.tokens({ symbol: symbolParam, with_logo: 1, with_price: 1 })
    : null;
  const explorerUrl = useMemo(
    () => buildExplorerApiUrl(config.apiBaseUrl, tokenEndpoint),
    [config.apiBaseUrl, tokenEndpoint],
  );
  const rpcUrl = useMemo(
    () =>
      symbolParam
        ? buildRpcUrl(
            config.nexus,
            "GetToken",
            { symbol: symbolParam, extended: true },
            config.rpcBaseUrl,
          )
        : null,
    [config.nexus, config.rpcBaseUrl, symbolParam],
  );
  const { data, loading, error } = useApi<TokenResults>(tokenEndpoint);
  const isNotFound = isNotFoundError(error);

  const token = data?.tokens?.[0];

  const items = useMemo(() => {
    if (!token) return [];
    const price = getTokenPrice(token.price);

    return [
      { label: echo("name"), value: token.name ?? "—" },
      { label: echo("symbol"), value: token.symbol ?? "—" },
      { label: echo("decimals"), value: token.decimals ?? "—" },
      {
        label: echo("current_supply"),
        value: token.current_supply ? numberFormat(token.current_supply) : "—",
      },
      {
        label: echo("max_supply"),
        value: token.max_supply ? numberFormat(token.max_supply) : "—",
      },
      {
        label: echo("burnedSupply"),
        value: token.burned_supply ? numberFormat(token.burned_supply) : "—",
      },
      {
        label: echo("price"),
        value: price ? `${price.value} ${price.currency}` : "—",
      },
    ];
  }, [token, echo]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="grid gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-end gap-4">
                {token ? (
                  <ExportButton
                    data={[token]}
                    filename={`PhantasmaExplorer-Token-${symbolParam}.csv`}
                    label={echo("table-exportCsv")}
                  />
                ) : null}
              </div>
              <div className="mt-4">
                {loading && <div className="text-sm text-muted-foreground">{echo("loading")}</div>}
                {error && <div className="text-sm text-destructive">{echo("failed_to_load_token")}</div>}
                {token ? <DetailList items={items} /> : null}
              </div>
            </div>
            <TokenFlags token={token} />
          </div>
        ),
      },
      {
        id: "holders",
        label: echo("tab-holders"),
        content: <HoldersTable symbol={symbolParam} />,
      },
      {
        id: "instructions",
        label: echo("tab-instructions"),
        content: (
          <InstructionsPanel script={token?.script_raw ?? null} loading={loading} error={error} />
        ),
      },
      {
        id: "script",
        label: echo("tab-script"),
        content: <ScriptPanel script={token?.script_raw ?? null} />,
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: <RawJsonPanel data={token} rpcUrl={rpcUrl} explorerUrl={explorerUrl} />,
      },
    ],
    [echo, error, items, loading, symbolParam, token, explorerUrl, rpcUrl],
  );

  if (isNotFound || (!loading && !error && !token)) {
    return (
      <AppShell>
        <NotFoundPanel description={echo("not_found_token")} />
      </AppShell>
    );
  }

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("token")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <TokenMark token={token} symbol={symbolParam} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold">{symbolParam}</h1>
            <CopyButton value={symbolParam} />
          </div>
          {token?.name ? <div className="text-xs text-muted-foreground">{token.name}</div> : null}
        </div>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="grid gap-8">
        <SectionTabs tabs={tabs} header={header} />
      </div>
    </AppShell>
  );
}
