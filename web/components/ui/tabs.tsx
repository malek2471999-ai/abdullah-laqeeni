import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  href: string;
}

export function TabNav({
  items,
  active,
  className,
}: {
  items: TabItem[];
  active: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-card',
        className,
      )}
      aria-label="Tabs"
    >
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition',
              selected
                ? 'bg-brand text-white shadow-[0_8px_20px_-12px_rgba(8,124,255,0.9)]'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
