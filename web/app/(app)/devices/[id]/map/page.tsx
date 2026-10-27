import Link from 'next/link';
import { ExternalLink, MapPin, Navigation, Satellite, ShieldQuestion } from 'lucide-react';
import { DeviceActions } from '@/components/device-actions';
import { DeviceMap } from '@/components/device-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi } from '@/lib/session.server';
import type { Device } from '@/lib/types';
import { formatCoord, formatNumber, relativeTime } from '@/lib/utils';

export default async function DeviceMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const { locale, dict } = await getPreferences();
  const device = await serverApi<Device>(`devices/${id}`);
  const location = device.location;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand" />
              {dict.locationMap}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {location ? relativeTime(location.capturedAt, locale) : dict.noLocation}
            </p>
          </div>
          {location ? (
            <Badge tone={device.locationStale ? 'violet' : 'mint'}>
              {device.locationStale ? dict.stale : dict.live}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="pt-0">
          <DeviceMap
            points={location ? [location] : []}
            dict={dict}
            className="h-[420px] sm:h-[520px]"
          />
          {!device.online ? (
            <p className="mt-3 rounded-xl border border-violet/25 bg-violet/10 px-3 py-2 text-xs text-violet">
              {dict.offlineWarningText}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{dict.lastKnownLocation}</CardTitle>
            <p className="text-xs text-muted-foreground">{dict.locationHistory}</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-sm">
            {location ? (
              <>
                <Row label="Latitude" value={formatCoord(location.latitude)} mono />
                <Row label="Longitude" value={formatCoord(location.longitude)} mono />
                <Row
                  label={dict.accuracy}
                  value={`± ${formatNumber(location.accuracyMeters, locale)} m`}
                />
                <Row label={dict.capturedAt} value={relativeTime(location.capturedAt, locale)} />
                <Row
                  label={dict.status}
                  value={`${location.isMock ? 'Mock' : 'GPS'} · ${location.source}`}
                />
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium transition hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {dict.openInMaps}
                  </a>
                  <Link
                    href={`/devices/${device.id}/history`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium transition hover:bg-muted"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    {dict.route}
                  </Link>
                </div>
                {device.locationStale ? (
                  <p className="rounded-xl border border-violet/25 bg-violet/10 px-3 py-2 text-xs text-violet">
                    {dict.locationStale}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="py-6 text-center">
                <Satellite className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">{dict.noLocation}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dict.locateDescription}</p>
              </div>
            )}
            <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
              <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {dict.disclaimer}
            </div>
          </CardContent>
        </Card>

        <DeviceActions device={device} dict={dict} />
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-semibold ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</span>
    </div>
  );
}
