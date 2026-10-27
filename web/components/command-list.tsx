import type { Dictionary } from '@/lib/i18n';
import type { CommandStatus, RemoteCommand } from '@/lib/types';
import { commandLabelKey, relativeTime, statusTone } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { Terminal } from 'lucide-react';

export function commandStatusLabel(status: CommandStatus, dict: Dictionary): string {
  const map: Record<CommandStatus, string> = {
    PENDING: dict.statusPending,
    DELIVERED: dict.statusDelivered,
    ACKNOWLEDGED: dict.statusAcknowledged,
    FAILED: dict.statusFailed,
    EXPIRED: dict.statusExpired,
    CANCELLED: dict.statusCancelled,
  };
  return map[status];
}

function payloadSummary(command: RemoteCommand): string {
  const payload = command.payload ?? {};
  if (command.type === 'MESSAGE' && typeof payload.message === 'string') return payload.message;
  if (typeof payload.durationSeconds === 'number') return `${payload.durationSeconds}s`;
  if (typeof payload.message === 'string') return payload.message;
  return '';
}

export function CommandList({
  commands,
  locale,
  dict,
  limit,
}: {
  commands: RemoteCommand[];
  locale: 'en' | 'ar' | 'fr';
  dict: Dictionary;
  limit?: number;
}) {
  if (commands.length === 0) {
    return (
      <EmptyState
        icon={<Terminal className="h-5 w-5" />}
        title={dict.noCommands}
        description={dict.statusDescription}
      />
    );
  }

  const visible = limit ? commands.slice(0, limit) : commands;

  return (
    <ul className="divide-y divide-border">
      {visible.map((command) => {
        const summary = payloadSummary(command);
        return (
          <li key={command.id} className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{dict[commandLabelKey(command.type)]}</p>
                <Badge className={statusTone(command.status)}>
                  {commandStatusLabel(command.status, dict)}
                </Badge>
              </div>
              {summary ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{summary}</p>
              ) : null}
              {command.failureReason ? (
                <p className="mt-0.5 text-xs text-danger">{command.failureReason}</p>
              ) : null}
            </div>
            <div className="text-end text-[10px] text-muted-foreground">
              <p>{relativeTime(command.createdAt, locale)}</p>
              <p className="mt-0.5">
                {dict.commandExpires}: {relativeTime(command.expiresAt, locale)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
