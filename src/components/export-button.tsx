"use client";

import { Download } from "lucide-react";
import csvDownload from "json-to-csv-export";

interface ExportButtonProps {
  data: unknown[];
  filename: string;
  label?: string;
}

export function ExportButton({ data, filename, label = "Export" }: ExportButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      onClick={() => csvDownload(data, filename, ",")}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
