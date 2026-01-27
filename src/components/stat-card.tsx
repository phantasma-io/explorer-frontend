import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  meta?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, meta, icon }: StatCardProps) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
          {label}
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
      <div className="mt-4 text-2xl font-semibold text-foreground">
        {value}
      </div>
      {meta ? (
        <div className="mt-2 text-xs text-muted-foreground">{meta}</div>
      ) : null}
    </div>
  );
}
