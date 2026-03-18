"use client";

import { useMemo } from "react";
import { useEcho } from "@/lib/i18n/use-echo";
import type { ContractMethod as ApiContractMethod } from "@/lib/types/api";

interface MethodParam {
  name?: string;
  type?: string;
}

interface MethodDefinition {
  name?: string;
  returnType?: string;
  parameters?: MethodParam[];
}

interface MethodsPanelProps {
  methods?: ApiContractMethod[] | unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toMethodParam = (value: unknown): MethodParam => {
  if (!isRecord(value)) return {};
  return {
    name: typeof value.name === "string" ? value.name : undefined,
    type: typeof value.type === "string" ? value.type : undefined,
  };
};

const toMethodDefinition = (value: unknown, index: number): MethodDefinition => {
  if (!isRecord(value)) {
    return { name: `Method ${index + 1}` };
  }

  const parameters = Array.isArray(value.parameters)
    ? value.parameters.map(toMethodParam)
    : undefined;

  return {
    name: typeof value.name === "string" ? value.name : `Method ${index + 1}`,
    returnType: typeof value.returnType === "string" ? value.returnType : undefined,
    parameters,
  };
};

const formatParameterSignature = (param: MethodParam, index: number) => {
  const name = param.name?.trim();
  const type = param.type?.trim();

  if (name && type) return `${name}: ${type}`;
  if (name) return name;
  if (type) return type;
  return `arg${index + 1}`;
};

export function MethodsPanel({ methods }: MethodsPanelProps) {
  const { echo } = useEcho();

  const parsed = useMemo(() => {
    if (!Array.isArray(methods)) return [] as MethodDefinition[];
    // Normalize unknown method payloads from the API into a predictable shape.
    return methods.map((item, index) => toMethodDefinition(item, index));
  }, [methods]);

  if (!parsed.length) {
    return <div className="text-sm text-muted-foreground">{echo("no_methods")}</div>;
  }

  return (
    <div className="grid gap-3">
      {parsed.map((method, index) => (
        <details key={`${method.name ?? "method"}-${index}`} className="group rounded-xl border border-border/70 bg-card/85 px-4 py-3 transition-colors open:border-border open:bg-muted/15">
          <summary className="cursor-pointer list-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="break-all font-mono text-sm leading-6">
                  <span className="font-semibold text-foreground">
                    {method.name ?? `Method ${index + 1}`}
                  </span>
                  <span className="text-muted-foreground">(</span>
                  {(method.parameters ?? []).map((param, paramIndex) => (
                    <span key={`${param.name ?? "param"}-${paramIndex}`}>
                      {paramIndex > 0 ? <span className="text-muted-foreground">, </span> : null}
                      <span className="text-foreground/75">
                        {param.name?.trim() || `arg${paramIndex + 1}`}
                      </span>
                      {param.type?.trim() ? (
                        <>
                          <span className="text-muted-foreground">: </span>
                          <span className="font-medium text-foreground/65">{param.type.trim()}</span>
                        </>
                      ) : null}
                    </span>
                  ))}
                  <span className="text-muted-foreground">)</span>
                </div>
                {method.returnType ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {echo("return-type")}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-card/70 px-2.5 py-1 font-mono text-foreground/75">
                      {method.returnType}
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {method.parameters?.length ?? 0} {echo("params_short")}
              </div>
            </div>
          </summary>
          <div className="mt-3 grid gap-2 border-t border-border/70 pt-3 text-sm text-muted-foreground">
            {method.parameters?.length ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {echo("params")}
                </div>
                <div className="mt-2 grid gap-2">
                  {method.parameters.map((param, paramIndex) => (
                    <div key={`${param.name ?? "param"}-${paramIndex}`} className="rounded-lg border border-border/70 bg-card/60 px-3 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {echo("name")}
                          </div>
                          <div className="mt-1 break-all font-mono text-sm font-medium text-foreground/85">
                            {param.name ?? `arg${paramIndex + 1}`}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {echo("type")}
                          </div>
                          <div className="mt-1 inline-flex max-w-full items-center rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 font-mono text-xs text-foreground/75">
                            {param.type ?? "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
