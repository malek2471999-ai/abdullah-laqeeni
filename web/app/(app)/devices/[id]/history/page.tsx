import Link from 'next/link';
import { Clock, MapPin, Route, ShieldOff } from 'lucide-react';
import { DeviceMap } from '@/components/device-map';
import { RefreshButton } from '@/components/refresh-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi } from '@/lib/session.server';
import type { Device, DeviceHistory } from '@/lib/types';
import { formatCoord, formatNumber, relativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const RANGES = [
  { key: '24h', hours: 24, label: 'hours24' },
  { key: '7d', hours: 24 * 7, label: 'days7' },
  { key: '30d', hours: 24 * 30, label: 'days30' },
] as const;

export default async function DeviceHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  await requireUser();
  const { locale, dict } = await getPreferences();
  const device = await serverApi<Device>(`devices/${id}`);
  const range = RANGES.find((item) => item.key === query.range) ?? RANGES[0];
  const from = new Date(Date.now() - range.hours * 3600 * 1000).toISOString();
  const history = await serverApi<DeviceHistory>(
    `devices/${id}/history?limit=500&from=${encodeURIComponent(from)}`,
  );

  const latestFirst = history.points;
  const chronological = [...history.points].reverse();
  const rangeLabel =
    range.key === '24h'
      ? `24 ${dict.hours}`
      : range.key === '7d'
        ? `7 ${dict.days}`
        : `30 ${dict.days}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title={dict.historyTitle}
        description={dict.historySubtitle}
        actions={
          <>
            <div className="flex rounded-lg border border-border bg-card p-0.5">
              {RANGES.map((item) => (
                <Link
                  key={item.key}
                  href={`/devices/${id}/history?range=${item.key}`}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition',
                    item.key === range.key
                      ? 'bg-brand text-white'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.key === '24h'
                    ? `24 ${dict.hours}`
                    : item.key === '7d'
                      ? `7 ${dict.days}`
                      : `30 ${dict.days}`}
                </Link>
              ))}
            </div>
            <RefreshButton dict={dict} />
          </>
        }
      />

      {!history.historyEnabled ? (
        <EmptyState
          icon={<ShieldOff className="h-5 w-5" />}
          title={dict.historyDisabled}
          description={dict.historyDisabledText}
          action={
            <Link
              href={`/devices/${device.id}/settings`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90"
            >
              {dict.enableHistory}
            </Link>
          }
        />
      ) : latestFirst.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title={dict.historyEmpty}
          description={`${dict.retentionDays}: ${history.retentionDays} ${dict.days}`}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-brand" />
                  {dict.route}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {latestFirst.length} {dict.points} · {rangeLabel}
                </p>
              </div>
              <Badge tone="brand">
                <MapPin className="h-3 w-3" />
                {dict.locationHistory}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <DeviceMap
                points={chronological}
                dict={dict}
                showRoute
                className="h-[420px] sm:h-[520px]"
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>{dict.points}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {dict.retentionDays}: {history.retentionDays} {dict.days}
              </p>
            </CardHeader>
            <CardContent className="max-h-[560px] overflow-y-auto p-0">
              <ol className="divide-y divide-border">
                {latestFirst.map((point, index) => (
                  <li key={point.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-[10px] font-bold text-brand">
                      {latestFirst.length - index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs tabular-nums" dir="ltr">
                        {formatCoord(point.latitude)}, {formatCoord(point.longitude)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {relativeTime(point.capturedAt, locale)} · ±{' '}
                        {formatNumber(point.accuracyMeters, locale)} m
                        {point.isMock ? ' · Mock' : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
