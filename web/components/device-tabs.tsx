'use client';

import { usePathname } from 'next/navigation';
import { TabNav } from '@/components/ui/tabs';
import type { Dictionary } from '@/lib/i18n';

export function DeviceTabs({ deviceId, dict }: { deviceId: string; dict: Dictionary }) {
  const pathname = usePathname();
  const base = `/devices/${deviceId}`;
  const tabs = [
    { key: 'overview', label: dict.overview, href: base },
    { key: 'map', label: dict.map, href: `${base}/map` },
    { key: 'history', label: dict.history, href: `${base}/history` },
    { key: 'commands', label: dict.commands, href: `${base}/commands` },
    { key: 'settings', label: dict.settingsTab, href: `${base}/settings` },
  ];
  const active = pathname === base ? 'overview' : pathname.split('/').pop() ?? 'overview';

  return <TabNav items={tabs} active={active} className="w-full" />;
}
