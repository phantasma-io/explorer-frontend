"use client";

import { AppShell } from "@/components/app-shell";
import { TransactionsTable } from "@/components/transactions-table";
import { useEcho } from "@/lib/i18n/use-echo";

export default function TransactionsPage() {
  const { echo } = useEcho();

  return (
    <AppShell>
      <div className="grid gap-6">
        <TransactionsTable title={echo("transactions")} />
      </div>
    </AppShell>
  );
}
