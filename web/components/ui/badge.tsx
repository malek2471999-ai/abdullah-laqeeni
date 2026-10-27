import { cn } from '@/lib/utils';

type Tone = 'default' | 'brand' | 'mint' | 'danger' | 'violet' | 'muted';

const tones: Record<Tone, string> = {
  default: 'border-border bg-muted text-foreground',
  brand: 'border-brand/25 bg-brand/10 text-brand',
  mint: 'border-mint/25 bg-mint/10 text-mint',
  danger: 'border-danger/25 bg-danger/10 text-danger',
  violet: 'border-violet/25 bg-violet/10 text-violet',
  muted: 'border-border bg-transparent text-muted-foreground',
};

export function Badge({
  tone = 'default',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        online ? 'bg-mint shadow-[0_0_10px_rgba(0,214,154,0.8)]' : 'bg-muted-foreground/40',
      )}
      aria-hidden
    />
  );
}
