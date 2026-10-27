import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
      aria-hidden
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
