"use client";

interface TxStateBadgeProps {
  state?: string | null;
  className?: string;
}

type BadgeTone = "success" | "warning" | "danger" | "dangerStrong" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  danger: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  dangerStrong: "border-rose-600/60 bg-rose-600/20 text-rose-100",
  neutral: "border-border/70 bg-muted/50 text-muted-foreground",
};

export function TxStateBadge({ state, className }: TxStateBadgeProps) {
  const normalized = (state ?? "").trim().toLowerCase();
  let label = state ?? "—";
  let tone: BadgeTone = "neutral";

  // Phantasma exposes "Halt" for successful execution; surface it as Success.
  if (normalized === "halt") {
    label = "Success";
    tone = "success";
  } else if (normalized === "break") {
    label = "Break";
    tone = "dangerStrong";
  } else if (normalized === "fault" || normalized.includes("fail")) {
    label = "Failed";
    tone = "danger";
  } else if (normalized === "pending") {
    label = "Pending";
    tone = "warning";
  }

  const baseClasses = `inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[tone]}`;
  const badgeClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return <span className={badgeClasses}>{label}</span>;
}
