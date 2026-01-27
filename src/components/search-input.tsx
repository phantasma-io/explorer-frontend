"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEcho } from "@/lib/i18n/use-echo";

interface SearchInputProps {
  placeholder?: string;
  onSubmit?: () => void;
}

export function SearchInput({ placeholder, onSubmit }: SearchInputProps) {
  const [value, setValue] = useState("");
  const router = useRouter();
  const { echo } = useEcho();

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?query=${encodeURIComponent(trimmed)}`);
    onSubmit?.();
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/85 px-4 py-3 shadow-sm backdrop-blur">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={placeholder ?? echo("search")}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        aria-label={echo("search")}
      />
      {value ? (
        <button
          type="button"
          className="rounded-full p-1 text-muted-foreground transition hover:text-foreground"
          onClick={() => setValue("")}
          aria-label={echo("clear")}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm"
        onClick={handleSubmit}
      >
        {echo("search")}
      </button>
    </div>
  );
}
