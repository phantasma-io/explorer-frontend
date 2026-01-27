"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useEcho } from "@/lib/i18n/use-echo";

interface CopyButtonProps {
  value: string | number | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CopyButtonProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

export function CopyButton({ value, size = "sm", className }: CopyButtonProps) {
  const { echo } = useEcho();
  const [copied, setCopied] = useState(false);
  const text = value === null || value === undefined ? "" : String(value);

  useEffect(() => {
    if (!copied) return undefined;
    // Keep visual feedback brief so the icon returns to the copy state quickly.
    const timer = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    let success = false;
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch {
      // Fallback for browsers/environments where Clipboard API is unavailable.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }
    if (success) {
      setCopied(true);
    }
  }, [text]);

  const baseClasses = `inline-flex ${SIZE_CLASSES[size]} items-center justify-center rounded-xl border border-border/70 bg-card/85 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50`;
  const buttonClasses = className ? `${baseClasses} ${className}` : baseClasses;
  const label = copied ? echo("copied-to-clipboard") : echo("copy-to-clipboard");

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      aria-label={label}
      title={label}
      className={buttonClasses}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
