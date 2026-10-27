import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl border border-border bg-background/60 px-3.5 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-brand/60 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full rounded-xl border border-border bg-background/60 px-3.5 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-brand/60 focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full appearance-none rounded-xl border border-border bg-background/60 px-3.5 text-sm text-foreground shadow-sm outline-none transition focus:border-brand/60 focus:ring-4 focus:ring-brand/10 disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
