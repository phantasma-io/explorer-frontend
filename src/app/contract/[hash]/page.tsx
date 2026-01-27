"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DetailList } from "@/components/detail-list";
import { ExportButton } from "@/components/export-button";
import { InstructionsPanel } from "@/components/instructions-panel";
import { RawJsonPanel } from "@/components/raw-json-panel";
import { ScriptPanel } from "@/components/script-panel";
import { SectionTabs } from "@/components/section-tabs";
import { endpoints } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useRouteParam } from "@/lib/hooks/use-route-param";
import type { ContractResults } from "@/lib/types/api";
import { formatDateTime, unixToDate } from "@/lib/utils/time";
import { useEcho } from "@/lib/i18n/use-echo";

export default function ContractPage() {
  const { echo } = useEcho();
  const contractHash = useRouteParam("hash");
  const contractEndpoint = contractHash
    ? endpoints.contracts({
        hash: contractHash,
        with_methods: 1,
        with_script: 1,
        with_token: 1,
        with_creation_event: 1,
      })
    : null;
  const { data, loading, error } = useApi<ContractResults>(contractEndpoint);

  const contract = data?.contracts?.[0];

  const items = useMemo(() => {
    if (!contract) return [];
    const created = contract.create_date
      ? Number.isFinite(Number(contract.create_date))
        ? formatDateTime(unixToDate(contract.create_date))
        : contract.create_date
      : "—";
    return [
      { label: echo("name"), value: contract.name ?? "—" },
      { label: echo("hash"), value: contract.hash ?? "—" },
      { label: echo("symbol"), value: contract.symbol ?? "—" },
      { label: echo("type"), value: contract.type ?? "—" },
      { label: echo("compiler"), value: contract.compiler ?? "—" },
      { label: echo("created_at"), value: created },
      {
        label: echo("address"),
        value: contract.address?.address ? (
          <Link href={`/address/${contract.address.address}`} className="link">
            {contract.address.address}
          </Link>
        ) : (
          "—"
        ),
      },
      {
        label: echo("token"),
        value: contract.token?.symbol ? (
          <Link href={`/token/${contract.token.symbol}`} className="link">
            {contract.token.symbol}
          </Link>
        ) : (
          "—"
        ),
      },
      { label: echo("tab-methods"), value: contract.methods?.length ?? 0 },
    ];
  }, [contract, echo]);

  const tabs = useMemo(
    () => [
      {
        id: "overview",
        label: echo("tab-overview"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                {echo("tab-overview")}
              </div>
              {contract ? (
                <ExportButton
                  data={[contract]}
                  filename={`PhantasmaExplorer-Contract-${contractHash}.csv`}
                  label={echo("table-exportCsv")}
                />
              ) : null}
            </div>
            <div className="mt-4">
              {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {error && <div className="text-sm text-destructive">Failed to load contract.</div>}
              {contract ? <DetailList items={items} /> : null}
            </div>
          </div>
        ),
      },
      {
        id: "methods",
        label: echo("methods"),
        content: (
          <div className="glass-panel rounded-2xl p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              {echo("methods")}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              {contract?.methods?.length
                ? contract.methods.map((method, index) => (
                    <div key={`${method.name ?? index}-${index}`}>
                      {method.name ?? "Method"}({method.parameters?.length ?? 0} params)
                    </div>
                  ))
                : "No methods."}
            </div>
          </div>
        ),
      },
      {
        id: "instructions",
        label: echo("instructions"),
        content: <InstructionsPanel script={contract?.script_raw ?? null} loading={loading} error={error} />,
      },
      {
        id: "script",
        label: echo("script"),
        content: <ScriptPanel script={contract?.script_raw ?? null} />,
      },
      {
        id: "raw",
        label: echo("tab-raw"),
        content: <RawJsonPanel data={contract} />,
      },
    ],
    [contract, contractHash, echo, error, items, loading],
  );

  const header = (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {echo("contract")}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="break-all text-xl font-semibold">{contractHash}</h1>
        <CopyButton value={contractHash} />
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
