import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Link2,
  MapPin,
  Radar,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react';
import { DeviceCard } from '@/components/device-card';
import { AutoRefresh } from '@/components/auto-refresh';
import { RefreshButton } from '@/components/refresh-button';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi, tryServerApi } from '@/lib/session.server';
import type { AppNotification, Device, UnreadCount } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  const { locale, dict } = await getPreferences();
  const [devices, notifications, unread] = await Promise.all([
    serverApi<Device[]>('devices'),
    tryServerApi<AppNotification[]>('notifications?limit=6'),
    tryServerApi<UnreadCount>('notifications/unread-count'),
  ]);

  const online = devices.filter((device) => device.online).length;
  const lost = devices.filter((device) => device.lostMode).length;

  const stats = [
    {
      label: dict.totalDevices,
      value: devices.length,
      icon: Smartphone,
      tone: 'text-brand bg-brand/10',
      href: '/devices',
    },
    {
      label: dict.onlineDevices,
      value: online,
      icon: Wifi,
      tone: 'text-mint bg-mint/10',
      href: '/devices',
    },
    {
      label: dict.lostDevices,
      value: lost,
      icon: AlertTriangle,
      tone: 'text-danger bg-danger/10',
      href: '/devices',
    },
    {
      label: dict.unreadAlerts,
      value: unread?.count ?? 0,
      icon: Bell,
      tone: 'text-violet bg-violet/10',
      href: '/notifications',
    },
  ];

  const quickLinks = [
    { href: '/pair', label: dict.pairDevice, description: dict.pairInstructions, icon: Link2 },
    {
      href: devices[0] ? `/devices/${devices[0].id}/map` : '/devices',
      label: dict.locationMap,
      description: dict.locateDescription,
      icon: MapPin,
    },
    {
      href: devices[0] ? `/devices/${devices[0].id}/commands` : '/devices',
      label: dict.commands,
      description: dict.statusDescription,
      icon: Radar,
    },
    { href: '/security', label: dict.security, description: dict.securitySubtitle, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <PageHeader
        title={`${dict.welcome}, ${user.name.split(/\s+/)[0] || user.email}`}
        description={dict.overviewSubtitle}
        actions={
          <>
            <RefreshButton dict={dict} />
            <Link
              href="/pair"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:bg-brand/90"
            >
              <Link2 className="h-3.5 w-3.5" />
              {dict.pairDevice}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border border-border bg-card p-4 shadow-card transition hover:border-brand/30"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition group-hover:text-brand rtl:rotate-180" />
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{dict.allDevices}</h2>
          <p className="text-xs text-muted-foreground">
            {devices.length} {dict.deviceCount}
          </p>
        </div>
        {devices.length > 0 ? (
          <Link href="/devices" className="text-xs font-semibold text-brand hover:underline">
            {dict.viewAll}
          </Link>
        ) : null}
      </div>

      {devices.length === 0 ? (
        <EmptyState
          icon={<Smartphone className="h-5 w-5" />}
          title={dict.noDevices}
          description={dict.noDevicesText}
          action={
            <Link
              href="/pair"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90"
            >
              <Link2 className="h-4 w-4" />
              {dict.addDevice}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} locale={locale} dict={dict} />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>{dict.recentActivity}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.notificationsSubtitle}</p>
            </div>
            <Link href="/notifications" className="text-xs font-semibold text-brand hover:underline">
              {dict.viewAll}
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {notifications && notifications.length > 0 ? (
              <ul className="divide-y divide-border">
                {notifications.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet">
                      <Bell className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-sm font-medium leading-5">{item.title}</p>
                        {!item.readAt ? (
                          <Badge tone="brand" className="shrink-0">
                            {dict.unread}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.body}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {item.device?.name ? `${item.device.name} · ` : ''}
                        {relativeTime(item.createdAt, locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">{dict.noActivity}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dict.notificationsEmptyText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.quickActions}</CardTitle>
            <p className="text-xs text-muted-foreground">{dict.tagline}</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 transition hover:border-brand/30 hover:bg-muted/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{link.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {link.description}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-brand rtl:rotate-180" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
