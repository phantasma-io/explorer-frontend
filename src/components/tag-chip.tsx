import { ReactNode } from "react";

export type TagTone =
  | "sr"
  | "deploy"
  | "series"
  | "mint"
  | "trade"
  | "stake"
  | "burn"
  | "transfer"
  | "nft"
  | "fungible";

const toneClasses: Record<TagTone, string> = {
  sr: "border-indigo-500 bg-indigo-500 text-white",
  deploy: "border-slate-700 bg-slate-700 text-white",
  series: "border-slate-500 bg-slate-500 text-white",
  mint: "border-amber-400 bg-amber-400 text-slate-950",
  trade: "border-fuchsia-500 bg-fuchsia-500 text-white",
  stake: "border-teal-500 bg-teal-500 text-white",
  burn: "border-rose-500 bg-rose-500 text-white",
  transfer: "border-blue-500 bg-blue-500 text-white",
  nft: "border-violet-500 bg-violet-500 text-white",
  fungible: "border-cyan-400 bg-cyan-400 text-slate-950",
};

interface TagChipProps {
  label: string;
  tone: TagTone;
  icon?: ReactNode;
}

export function TagChip({ label, tone, icon }: TagChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}
