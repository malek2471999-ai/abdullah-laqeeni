import Link from 'next/link';
import {
  Activity,
  BatteryCharging,
  BatteryMedium,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  ShieldAlert,
  Signal,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { DeviceActions } from '@/components/device-actions';
import { DeviceMap } from '@/components/device-map';
import { CommandList } from '@/components/command-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi, tryServerApi } from '@/lib/session.server';
import type { Device, RemoteCommand } from '@/lib/types';
import { deviceTitle, formatDate, formatNumber, relativeTime } from '@/lib/utils';

export default async function DeviceOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const { locale, dict } = await getPreferences();
  const device = await serverApi<Device>(`devices/${id}`);
  const commands = await tryServerApi<RemoteCommand[]>(`devices/${id}/commands`);
  const location = device.location;

  const health = [
    {
      label: dict.batteryLevel,
      value: device.batteryLevel === null ? '—' : `${device.batteryLevel}%`,
      icon: BatteryMedium,
      tone: device.batteryLevel !== null && device.batteryLevel <= 15 ? 'text-danger' : 'text-mint',
    },
    {
      label: dict.charging,
      value: device.charging ? dict.chargingYes : dict.chargingNo,
      icon: BatteryCharging,
      tone: device.charging ? 'text-mint' : 'text-muted-foreground',
    },
    {
      label: dict.networkConnected,
      value:
        device.networkConnected === null
          ? dict.unknown
          : device.networkConnected
            ? dict.networkConnected
            : dict.offline,
      icon: device.networkConnected ? Wifi : WifiOff,
      tone: device.networkConnected ? 'text-brand' : 'text-violet',
    },
    {
      label: dict.networkType,
      value: device.networkType || dict.unknown,
      icon: Signal,
      tone: 'text-foreground',
    },
    {
      label: dict.lastSeen,
      value: relativeTime(device.lastSeenAt, locale),
      icon: Clock,
      tone: 'text-foreground',
    },
    {
      label: dict.appVersion,
      value: device.appVersion || dict.unknown,
      icon: Smartphone,
      tone: 'text-foreground',
    },
  ];

  return (
    <div className="space-y-4">
      {device.lostMode ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger text-white">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-danger">{dict.lostModeActive}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-danger/80">
              {device.lostMessage || dict.defaultLostMessage}
            </p>
            {device.contactPhone ? (
              <p className="mt-0.5 text-xs text-danger/70" dir="ltr">
                {device.contactPhone}
              </p>
            ) : null}
          </div>
          <Link
            href={`/devices/${device.id}/settings`}
            className="inline-flex h-9 items-center rounded-xl border border-danger/30 px-3 text-xs font-semibold text-danger transition hover:bg-danger/10"
          >
            {dict.settingsTab}
          </Link>
        </div>
      ) : null}

      {!device.online ? (
        <div className="rounded-2xl border border-violet/25 bg-violet/10 px-4 py-3 text-xs text-violet">
          <strong className="font-semibold">{dict.offlineWarning}.</strong> {dict.offlineWarningText}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand" />
                  {dict.lastKnownLocation}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {location
                    ? `${dict.accuracy}: ± ${formatNumber(location.accuracyMeters, locale)} m`
                    : dict.noLocation}
                </p>
              </div>
              {location ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {dict.openInMaps}
                </a>
              ) : null}
            </CardHeader>
            <CardContent className="pt-0">
              <DeviceMap points={location ? [location] : []} dict={dict} className="h-[280px]" />
              {location ? (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                  <span dir="ltr">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </span>
                  <span>
                    {dict.capturedAt}: {relativeTime(location.capturedAt, locale)}
                  </span>
                  {device.locationStale ? (
                    <span className="text-violet">{dict.locationStale}</span>
                  ) : (
                    <Badge tone="mint">{dict.live}</Badge>
                  )}
                  {location.isMock ? <Badge tone="danger">Mock</Badge> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-mint" />
                {dict.deviceHealth}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="grid gap-2 sm:grid-cols-2">
                {health.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${item.tone}`} />
                      <div className="min-w-0">
                        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd className="truncate text-sm font-semibold">{item.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <DeviceActions device={device} dict={dict} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-violet" />
                {dict.details}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="space-y-2.5 text-sm">
                {[
                  [dict.deviceName, deviceTitle(device)],
                  [dict.manufacturer, device.manufacturer],
                  [dict.model, device.model],
                  [dict.androidVersion, device.androidVersion],
                  [dict.appVersion, device.appVersion || '—'],
                  [dict.pairedAt, formatDate(device.pairedAt, locale)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="max-w-[60%] break-words text-end text-xs font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>{dict.recentActivity}</CardTitle>
            <p className="text-xs text-muted-foreground">{dict.commands}</p>
          </div>
          <Link
            href={`/devices/${device.id}/commands`}
            className="text-xs font-semibold text-brand hover:underline"
          >
            {dict.viewAll}
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {commands ? (
            <CommandList commands={commands} locale={locale} dict={dict} limit={5} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{dict.noCommands}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
