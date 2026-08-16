"use client";

import { AppShell } from "@/components/app-shell";
import { NotFoundPanel } from "@/components/not-found-panel";
import { useEcho } from "@/lib/i18n/use-echo";

export default function NotFound() {
  const { echo } = useEcho();

  return (
    <AppShell>
      <NotFoundPanel
        title={echo("not_found_page_title")}
        description={echo("not_found_page_desc")}
      />
    </AppShell>
  );
}
