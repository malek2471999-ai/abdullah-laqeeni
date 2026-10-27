import { AppShell } from '@/components/app-shell';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, tryServerApi } from '@/lib/session.server';
import type { UnreadCount } from '@/lib/types';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { locale, theme, dict } = await getPreferences();
  const unread = await tryServerApi<UnreadCount>('notifications/unread-count');

  return (
    <AppShell
      user={user}
      unread={unread?.count ?? 0}
      locale={locale}
      theme={theme}
      dict={dict}
    >
      {children}
    </AppShell>
  );
}
