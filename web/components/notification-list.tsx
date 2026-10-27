'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BatteryWarning,
  Bell,
  CheckCheck,
  CircleAlert,
  Loader2,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import type { AppNotification } from '@/lib/types';
import { api } from '@/lib/client';
import { readError } from '@/components/login-form';
import { useToast } from '@/components/providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { notificationLabel, relativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const icons = {
  DEVICE_ONLINE: Wifi,
  DEVICE_OFFLINE: WifiOff,
  COMMAND_ACK: Radio,
  LOCATION_UPDATE: MapPin,
  LOST_MODE: ShieldAlert,
  BATTERY_LOW: BatteryWarning,
  SECURITY: ShieldCheck,
} as const;

function iconFor(type: string) {
  return icons[type as keyof typeof icons] ?? CircleAlert;
}

export function NotificationList({
  items,
  locale,
  dict,
}: {
  items: AppNotification[];
  locale: 'en' | 'ar' | 'fr';
  dict: Dictionary;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [read, setRead] = useState<Set<string>>(
    () => new Set(items.filter((item) => item.readAt).map((item) => item.id)),
  );
  const [busy, setBusy] = useState<string | null>(null);

  const unread = items.filter((item) => !read.has(item.id)).length;

  const markRead = async (id: string) => {
    setBusy(id);
    try {
      await api(`notifications/${id}/read`, { method: 'POST', body: JSON.stringify({}) });
      setRead((current) => new Set(current).add(id));
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const markAll = async () => {
    setBusy('all');
    try {
      await api('notifications/read-all', { method: 'POST', body: JSON.stringify({}) });
      setRead(new Set(items.map((item) => item.id)));
      toast(dict.allRead, 'success');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-brand" />
          <span className="font-semibold">
            {unread} {dict.unread}
          </span>
          <span className="text-muted-foreground">
            / {items.length} {dict.notifications}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={markAll}
          disabled={busy !== null || unread === 0}
        >
          {busy === 'all' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCheck className="h-3.5 w-3.5" />
          )}
          {dict.markAll}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title={dict.notificationsEmpty}
          description={dict.notificationsEmptyText}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {items.map((item) => {
            const Icon = iconFor(item.type);
            const isRead = read.has(item.id);
            return (
              <li
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 p-4 transition sm:flex-row sm:items-start',
                  !isRead && 'bg-brand/[0.04]',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    !isRead ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold leading-5">{item.title}</p>
                    {!isRead ? <Badge tone="brand">{dict.unread}</Badge> : null}
                    <Badge tone="muted">{notificationLabel(item.type, dict)}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{relativeTime(item.createdAt, locale)}</span>
                    {item.device ? (
                      <Link
                        href={`/devices/${item.device.id}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {item.device.name}
                      </Link>
                    ) : null}
                  </div>
                </div>

                {!isRead ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="self-start"
                    onClick={() => markRead(item.id)}
                    disabled={busy !== null}
                  >
                    {busy === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}
                    {dict.markRead}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
