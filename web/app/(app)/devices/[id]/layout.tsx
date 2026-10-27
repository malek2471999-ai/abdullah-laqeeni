import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, Smartphone } from 'lucide-react';
import { AutoRefresh } from '@/components/auto-refresh';
import { DeviceTabs } from '@/components/device-tabs';
import { RefreshButton } from '@/components/refresh-button';
import { Badge, StatusDot } from '@/components/ui/badge';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi, ServerApiError } from '@/lib/session.server';
import type { Device } from '@/lib/types';
import { deviceTitle, relativeTime } from '@/lib/utils';

export default async function DeviceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const { locale, dict } = await getPreferences();

  let device: Device;
  try {
    device = await serverApi<Device>(`devices/${id}`);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) notFound();
    throw error;
  }

  const title = deviceTitle(device);

  return (
    <div className="space-y-5">
      <AutoRefresh />
      <div className="flex flex-col gap-4">
        <Link
          href="/devices"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          {dict.allDevices}
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <Smartphone className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
              <Badge tone={device.online ? 'mint' : 'muted'}>
                <StatusDot online={device.online} />
                {device.online ? dict.online : dict.offline}
              </Badge>
              {device.lostMode ? <Badge tone="danger">{dict.lostModeActive}</Badge> : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {device.manufacturer} {device.model} · Android {device.androidVersion} ·{' '}
              {dict.lastSeen}: {relativeTime(device.lastSeenAt, locale)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton dict={dict} />
            <Link
              href={`/devices/${device.id}/map`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
            >
              <MapPin className="h-3.5 w-3.5" />
              {dict.map}
            </Link>
          </div>
        </div>
      </div>

      <DeviceTabs deviceId={device.id} dict={dict} />

      {children}
    </div>
  );
}
