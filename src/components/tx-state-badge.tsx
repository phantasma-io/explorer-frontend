"use client";

import { useEcho } from "@/lib/i18n/use-echo";

interface TxStateBadgeProps {
  state?: string | null;
  className?: string;
}

type BadgeTone = "success" | "warning" | "danger" | "dangerStrong" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  success: "border-emerald-500 bg-emerald-500 text-white",
  warning: "border-amber-400 bg-amber-400 text-slate-950",
  danger: "border-rose-600 bg-rose-600 text-white",
  dangerStrong: "border-rose-600 bg-rose-600 text-white",
  neutral: "border-border/70 bg-muted/50 text-muted-foreground",
};

export function TxStateBadge({ state, className }: TxStateBadgeProps) {
  const { echo } = useEcho();
  const normalized = (state ?? "").trim().toLowerCase();
  let label = state ?? "—";
  let tone: BadgeTone = "neutral";

  // Phantasma exposes "Halt" for successful execution; surface it as Success.
  if (normalized === "halt") {
    label = echo("state_success");
    tone = "success";
  } else if (normalized === "break") {
    label = echo("state_break");
    tone = "dangerStrong";
  } else if (normalized === "fault") {
    label = echo("state_fault");
    tone = "dangerStrong";
  } else if (normalized === "pending") {
    label = echo("state_pending");
    tone = "warning";
  }

  const baseClasses = `inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[tone]}`;
  const badgeClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return <span className={badgeClasses}>{label}</span>;
}
