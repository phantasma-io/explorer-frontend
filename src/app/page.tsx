import { AppShell } from "@/components/app-shell";
import { HomeHero } from "@/components/home-hero";
import { LatestBlocks } from "@/components/latest-blocks";
import { LatestTransactions } from "@/components/latest-transactions";

export default function HomePage() {
  return (
    <AppShell>
      <div className="grid gap-10">
        <HomeHero />
        <section className="grid gap-6 lg:grid-cols-2">
          <LatestBlocks />
          <LatestTransactions />
        </section>
      </div>
    </AppShell>
  );
}
