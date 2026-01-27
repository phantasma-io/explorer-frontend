"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ComboOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  ariaLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function ComboSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
  align = "start",
  ariaLabel,
  triggerClassName,
  contentClassName,
}: ComboSelectProps) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/85 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-primary/50 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:shadow-none disabled:cursor-not-allowed disabled:opacity-60",
            triggerClassName,
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn("max-h-60 min-w-[12rem] p-1", contentClassName)}
      >
        <DropdownMenuRadioGroup value={value ?? ""} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="cursor-pointer text-xs uppercase tracking-[0.14em]"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
