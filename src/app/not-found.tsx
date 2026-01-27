import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="glass-panel rounded-3xl p-10 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
          404
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The explorer could not find the requested page.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground"
        >
          Back to home
        </Link>
      </div>
    </AppShell>
  );
}
