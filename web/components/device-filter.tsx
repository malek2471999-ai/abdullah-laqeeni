'use client';

import { useMemo, useState } from 'react';
import { Search, Smartphone } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import type { Device } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DeviceCard } from '@/components/device-card';

type Filter = 'all' | 'online' | 'offline' | 'lost';

export function DeviceFilter({
  devices,
  locale,
  dict,
}: {
  devices: Device[];
  locale: 'en' | 'ar' | 'fr';
  dict: Dictionary;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filters: { key: Filter; label: string; count: number }[] = useMemo(
    () => [
      { key: 'all', label: dict.all, count: devices.length },
      {
        key: 'online',
        label: dict.online,
        count: devices.filter((device) => device.online).length,
      },
      {
        key: 'offline',
        label: dict.offline,
        count: devices.filter((device) => !device.online).length,
      },
      {
        key: 'lost',
        label: dict.lostDevices,
        count: devices.filter((device) => device.lostMode).length,
      },
    ],
    [devices, dict],
  );

  const visible = devices.filter((device) => {
    if (filter === 'online' && !device.online) return false;
    if (filter === 'offline' && device.online) return false;
    if (filter === 'lost' && !device.lostMode) return false;
    const haystack = `${device.name} ${device.manufacturer} ${device.model}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`${dict.search}…`}
            className="ps-9"
            aria-label={dict.search}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                filter === item.key
                  ? 'bg-brand text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] tabular-nums',
                  filter === item.key ? 'bg-white/20' : 'bg-muted',
                )}
              >
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
          <Smartphone className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">{dict.notFound}</p>
          <p className="mt-1 text-xs text-muted-foreground">{dict.noDevicesText}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((device) => (
            <DeviceCard key={device.id} device={device} locale={locale} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
