'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function RefreshButton({
  dict,
  className,
  label,
}: {
  dict: Dictionary;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
    });
    window.setTimeout(() => setSpinning(false), 900);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(className)}
      onClick={refresh}
      disabled={pending}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', (pending || spinning) && 'animate-spin')} />
      {label ?? dict.refresh}
    </Button>
  );
}
