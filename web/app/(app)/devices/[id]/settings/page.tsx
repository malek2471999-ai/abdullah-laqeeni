import { DeviceSettingsForm } from '@/components/device-settings-form';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi } from '@/lib/session.server';
import type { Device } from '@/lib/types';

export default async function DeviceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const { dict } = await getPreferences();
  const device = await serverApi<Device>(`devices/${id}`);

  return <DeviceSettingsForm device={device} dict={dict} />;
}
