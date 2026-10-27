'use client';

import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50',
        checked ? 'border-brand bg-brand' : 'border-border bg-muted',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
