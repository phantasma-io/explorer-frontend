"use client";

import { useMemo } from "react";
import { useEcho } from "@/lib/i18n/use-echo";

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
  methods?: unknown;
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

export function MethodsPanel({ methods }: MethodsPanelProps) {
  const { echo } = useEcho();

  const parsed = useMemo(() => {
    if (!Array.isArray(methods)) return [] as MethodDefinition[];
    // Normalize unknown method payloads from the API into a predictable shape.
    return methods.map((item, index) => toMethodDefinition(item, index));
  }, [methods]);

  if (!parsed.length) {
    return <div className="text-sm text-muted-foreground">{echo("no-results")}</div>;
  }

  return (
    <div className="grid gap-3">
      {parsed.map((method, index) => (
        <details key={`${method.name ?? "method"}-${index}`} className="group rounded-xl border border-border bg-card px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
            {method.name ?? `Method ${index + 1}`}
          </summary>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {method.returnType ? (
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {echo("return-type")}
                </span>
                <div className="mt-1 text-sm text-foreground">{method.returnType}</div>
              </div>
            ) : null}
            {method.parameters?.length ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {echo("params")}
                </div>
                <div className="mt-2 grid gap-2">
                  {method.parameters.map((param, paramIndex) => (
                    <div key={`${param.name ?? "param"}-${paramIndex}`} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {echo("name")}
                      </div>
                      <div className="text-sm text-foreground">{param.name ?? "—"}</div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {echo("type")}
                      </div>
                      <div className="text-sm text-foreground">{param.type ?? "—"}</div>
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
