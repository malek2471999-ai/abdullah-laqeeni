import { Info, Terminal } from 'lucide-react';
import { AutoRefresh } from '@/components/auto-refresh';
import { CommandList } from '@/components/command-list';
import { RefreshButton } from '@/components/refresh-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser, serverApi } from '@/lib/session.server';
import type { Device, RemoteCommand } from '@/lib/types';

export default async function DeviceCommandsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const { locale, dict } = await getPreferences();
  const [device, commands] = await Promise.all([
    serverApi<Device>(`devices/${id}`),
    serverApi<RemoteCommand[]>(`devices/${id}/commands`),
  ]);

  return (
    <div className="space-y-4">
      <AutoRefresh />
      <PageHeader
        title={dict.commands}
        description={dict.statusDescription}
        actions={<RefreshButton dict={dict} />}
      />

      {!device.online ? (
        <div className="flex items-start gap-2 rounded-xl border border-violet/25 bg-violet/10 px-4 py-3 text-xs leading-5 text-violet">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">{dict.offlineWarning}.</strong>{' '}
            {dict.offlineWarningText}
          </span>
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-brand" />
              {dict.recentActivity}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {commands.length} {dict.commands}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CommandList commands={commands} locale={locale} dict={dict} />
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-[11px] leading-5 text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {dict.disclaimer}
      </div>
    </div>
  );
}
