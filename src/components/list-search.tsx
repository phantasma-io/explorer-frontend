"use client";

import { Search } from "lucide-react";

interface ListSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
}

export function ListSearch({ value, onChange, onSubmit, placeholder }: ListSearchProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
      <Search className="h-4 w-4" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit(value);
          }
        }}
        className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <button
        type="button"
        onClick={() => onSubmit(value)}
        className="rounded-lg border border-border/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Go
      </button>
    </div>
  );
}
