import { AppShell } from "@/components/app-shell";
import { NotFoundPanel } from "@/components/not-found-panel";

export default function NotFound() {
  return (
    <AppShell>
      <NotFoundPanel
        title="Page not found"
        description="The explorer could not find the requested page."
      />
    </AppShell>
  );
}
