"use client";

import Link from "next/link";
import { useEcho } from "@/lib/i18n/use-echo";

interface NotFoundPanelProps {
  title?: string;
  description?: string;
  showHomeLink?: boolean;
  showRefresh?: boolean;
}

export function NotFoundPanel({
  title,
  description,
  showHomeLink = true,
  showRefresh = true,
}: NotFoundPanelProps) {
  const { echo } = useEcho();
  const heading = title ?? echo("not-found");
  const message = description ?? echo("not_found_generic");

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="glass-panel rounded-3xl p-10 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        404
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{heading}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      {showHomeLink || showRefresh ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {showHomeLink ? (
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
            >
              {echo("back_to_home")}
            </Link>
          ) : null}
          {showRefresh ? (
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-primary/50"
            >
              {echo("refresh")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
