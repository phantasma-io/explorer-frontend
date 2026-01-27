"use client";

import { usePathname } from "next/navigation";
import { useEcho } from "@/lib/i18n/use-echo";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/blocks", labelKey: "blocks" },
  { href: "/transactions", labelKey: "transactions" },
  { href: "/addresses", labelKey: "topAccounts" },
  { href: "/events", labelKey: "events" },
  { href: "/contracts", labelKey: "contracts" },
  { href: "/tokens", labelKey: "tokens" },
  { href: "/series", labelKey: "series" },
  { href: "/nfts", labelKey: "nfts" },
];

export function PrimaryNav() {
  const pathname = usePathname();
  const { echo } = useEcho();

  return (
    <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-6 pb-4">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <a
            key={item.href}
            href={item.href}
            className={clsx(
              "relative rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {echo(item.labelKey)}
            <span
              className={clsx(
                "absolute left-0 right-0 -bottom-1 h-[2px] rounded-full bg-primary transition-opacity",
                isActive ? "opacity-100" : "opacity-0"
              )}
            />
          </a>
        );
      })}
    </nav>
  );
}
