import { ReactNode } from "react";
import { Header } from "@/components/header";
import { PrimaryNav } from "@/components/primary-nav";
import { Footer } from "@/components/footer";

interface AppShellProps {
  children: ReactNode;
  withNav?: boolean;
}

export function AppShell({ children, withNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {withNav ? <PrimaryNav /> : null}
      <main className="mx-auto w-full max-w-7xl px-6 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
