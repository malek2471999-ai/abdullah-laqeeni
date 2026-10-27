import { AutoRefresh } from '@/components/auto-refresh';
import { NotificationList } from '@/components/notification-list';
import { PageHeader } from '@/components/ui/feedback';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi } from '@/lib/session.server';
import type { AppNotification } from '@/lib/types';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  await requireUser();
  const { locale, dict } = await getPreferences();
  const items = await serverApi<AppNotification[]>('notifications?limit=100');

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={45_000} />
      <PageHeader title={dict.notificationsTitle} description={dict.notificationsSubtitle} />
      <NotificationList items={items} locale={locale} dict={dict} />
    </div>
  );
}
