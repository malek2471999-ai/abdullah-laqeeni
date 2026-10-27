import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { DeviceFilter } from '@/components/device-filter';
import { RefreshButton } from '@/components/refresh-button';
import { AutoRefresh } from '@/components/auto-refresh';
import { EmptyState, PageHeader } from '@/components/ui/feedback';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi } from '@/lib/session.server';
import type { Device } from '@/lib/types';

export const metadata = { title: 'Devices' };

export default async function DevicesPage() {
  await requireUser();
  const { locale, dict } = await getPreferences();
  const devices = await serverApi<Device[]>('devices');

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <PageHeader
        title={dict.devices}
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

      {devices.length === 0 ? (
        <EmptyState
          icon={<Link2 className="h-5 w-5" />}
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
        <DeviceFilter devices={devices} locale={locale} dict={dict} />
      )}
    </div>
  );
}
