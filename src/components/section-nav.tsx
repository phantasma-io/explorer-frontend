interface SectionNavItem {
  id: string;
  label: string;
  description?: string;
}

interface SectionNavProps {
  title?: string;
  items: SectionNavItem[];
}

export function SectionNav({ title = "On this page", items }: SectionNavProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-panel sticky top-28 z-30 rounded-2xl px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </div>
      {/* Horizontal chips avoid floating sidebars and stay usable on mobile via scroll. */}
      <nav className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            title={item.description ? `${item.label} — ${item.description}` : item.label}
            className="shrink-0 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
