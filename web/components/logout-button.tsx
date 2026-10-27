'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function LogoutButton({
  dict,
  className,
  withIcon = true,
}: {
  dict: Dictionary;
  className?: string;
  withIcon?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await fetch('/api/session/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={signOut}
      disabled={busy}
    >
      {withIcon ? <LogOut className="h-3.5 w-3.5" /> : null}
      {busy ? dict.loading : dict.logout}
    </Button>
  );
}
