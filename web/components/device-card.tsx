import Link from 'next/link';
import { BatteryCharging, BatteryMedium, MapPin, Signal, Smartphone } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import type { Device } from '@/lib/types';
import { deviceTitle, formatCoord, relativeTime } from '@/lib/utils';
import { Badge, StatusDot } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function DeviceCard({
  device,
  locale,
  dict,
}: {
  device: Device;
  locale: 'en' | 'ar' | 'fr';
  dict: Dictionary;
}) {
  const location = device.location;
  const title = deviceTitle(device);
  const batteryTone =
    device.batteryLevel === null
      ? 'text-muted-foreground'
      : device.batteryLevel <= 15
        ? 'text-danger'
        : device.batteryLevel <= 35
          ? 'text-violet'
          : 'text-mint';

  return (
    <Card className="group flex flex-col overflow-hidden transition hover:border-brand/30 hover:shadow-glow">
      <div className="relative h-32 overflow-hidden border-b border-border bg-[#0b2038]">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-violet/15" />
        {location ? (
          <>
            <span className="absolute start-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-glow pulse-dot">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="absolute bottom-2.5 start-3 rounded-lg bg-navy/70 px-2 py-1 text-[10px] font-medium text-white/80 backdrop-blur" dir="ltr">
              {formatCoord(location.latitude)}, {formatCoord(location.longitude)}
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white/60">
            <MapPin className="h-5 w-5" />
            <span className="text-[11px]">{dict.noLocation}</span>
          </div>
        )}
        <div className="absolute start-3 top-3 flex items-center gap-1.5">
          <Badge tone={device.online ? 'mint' : 'muted'} className="backdrop-blur">
            <StatusDot online={device.online} />
            {device.online ? dict.online : dict.offline}
          </Badge>
          {device.lostMode ? (
            <Badge tone="danger" className="backdrop-blur">
              {dict.lostModeActive}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{title}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {device.manufacturer} {device.model} · Android {device.androidVersion}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Smartphone className="h-4 w-4" />
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-xl border border-border bg-muted/40 px-2.5 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <BatteryCharging className="h-3 w-3" />
              {dict.battery}
            </dt>
            <dd className={`mt-0.5 text-sm font-semibold ${batteryTone}`}>
              {device.batteryLevel === null ? '—' : `${device.batteryLevel}%`}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-2.5 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Signal className="h-3 w-3" />
              {dict.network}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold">
              {device.networkConnected === false
                ? dict.offline
                : device.networkType || dict.unknown}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-2.5 py-2">
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              <BatteryMedium className="h-3 w-3" />
              {dict.lastSeen}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold">
              {relativeTime(device.lastSeenAt, locale)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {device.charging ? dict.chargingYes : dict.chargingNo}
            {device.locationStale ? ` · ${dict.stale}` : ''}
          </span>
          <Link
            href={`/devices/${device.id}`}
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold transition group-hover:border-brand/40 group-hover:text-brand"
          >
            {dict.viewDevice}
          </Link>
        </div>
      </div>
    </Card>
  );
}
