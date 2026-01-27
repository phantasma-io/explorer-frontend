import { ReactNode } from "react";

interface DetailItem {
  label: string;
  value: ReactNode;
}

interface DetailListProps {
  items: DetailItem[];
}

export function DetailList({ items }: DetailListProps) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border/70 bg-card/85 px-4 py-3 sm:px-5 sm:py-4"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {item.label}
          </div>
          <div className="mt-1 text-sm text-foreground leading-relaxed">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
