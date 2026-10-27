import { RefreshButton } from '@/components/refresh-button';
import { SecurityPanel } from '@/components/security-panel';
import { PageHeader } from '@/components/ui/feedback';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, tryServerApi } from '@/lib/session.server';
import type { SecurityEvent, Session } from '@/lib/types';

export const metadata = { title: 'Security' };

export default async function SecurityPage() {
  const user = await requireUser();
  const { locale, dict } = await getPreferences();
  const [sessions, events] = await Promise.all([
    tryServerApi<Session[]>('auth/sessions'),
    tryServerApi<SecurityEvent[]>('auth/security-events'),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={dict.securityTitle}
        description={dict.securitySubtitle}
        actions={<RefreshButton dict={dict} />}
      />
      <SecurityPanel
        user={user}
        sessions={sessions ?? []}
        events={events ?? []}
        locale={locale}
        dict={dict}
      />
    </div>
  );
}
