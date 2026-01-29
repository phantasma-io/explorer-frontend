"use client";

import Link from "next/link";
import { useEcho } from "@/lib/i18n/use-echo";

interface NotFoundPanelProps {
  title?: string;
  description?: string;
  showHomeLink?: boolean;
}

export function NotFoundPanel({
  title,
  description = "The requested item could not be found.",
  showHomeLink = true,
}: NotFoundPanelProps) {
  const { echo } = useEcho();
  const heading = title ?? echo("not-found");

  return (
    <div className="glass-panel rounded-3xl p-10 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        404
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{heading}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      {showHomeLink ? (
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
        >
          Back to home
        </Link>
      ) : null}
    </div>
  );
}
