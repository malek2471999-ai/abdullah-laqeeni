'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronLeft,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Settings,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import type { Dictionary } from '@/lib/i18n';
import type { User } from '@/lib/types';
import { BrandMark } from '@/components/brand-mark';
import { PreferenceSwitcher } from '@/components/preference-switcher';
import { LogoutButton } from '@/components/logout-button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', key: 'dashboard' as const, icon: LayoutDashboard },
  { href: '/devices', key: 'devices' as const, icon: Smartphone },
  { href: '/pair', key: 'pairDevice' as const, icon: Link2 },
  { href: '/notifications', key: 'notifications' as const, icon: Bell },
  { href: '/security', key: 'security' as const, icon: Shield },
  { href: '/settings', key: 'settings' as const, icon: Settings },
];

export function AppShell({
  user,
  unread,
  locale,
  theme,
  dict,
  children,
}: {
  user: User;
  unread: number;
  locale: 'en' | 'ar' | 'fr';
  theme: 'dark' | 'light';
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href="/dashboard" className="flex items-center gap-3">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{dict.appName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{dict.slogan}</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1" aria-label={dict.menu}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className={cn('h-4.5 w-4.5 h-[18px] w-[18px]', active && 'text-brand')} />
              <span className="flex-1">{dict[item.key]}</span>
              {item.key === 'notifications' && unread > 0 ? (
                <Badge tone="danger" className="px-2 py-0">
                  {unread > 99 ? '99+' : unread}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/40 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-xs font-bold text-white">
            {initials(user.name || user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <PreferenceSwitcher locale={locale} theme={theme} dict={dict} compact />
        <LogoutButton dict={dict} className="w-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-e border-border bg-card/50 lg:block">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-border p-2 text-muted-foreground"
            aria-label={dict.menu}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <Shield className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-bold">{dict.appName}</span>
          </Link>
          <Link
            href="/notifications"
            className="relative rounded-xl border border-border p-2 text-muted-foreground"
            aria-label={dict.notifications}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 ? (
              <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </Link>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              role="presentation"
            />
            <div className="absolute inset-y-0 start-0 w-[85%] max-w-xs border-e border-border bg-card shadow-card animate-fade-up">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute end-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label={dict.close}
              >
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          aria-label={dict.menu}
        >
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium',
                  active ? 'text-brand' : 'text-muted-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.key === 'notifications' && unread > 0 ? (
                    <span className="absolute -end-1.5 -top-1 h-2 w-2 rounded-full bg-danger" />
                  ) : null}
                </span>
                <span className="max-w-full truncate">{dict[item.key]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
