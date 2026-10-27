'use client';

import { useState } from 'react';
import { Loader2, LogOut, ShieldOff } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { api } from '@/lib/client';
import { readError } from '@/components/login-form';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export function SignOutEverywhere({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await api('auth/logout-all', { method: 'POST', body: JSON.stringify({}) });
      await fetch('/api/session/logout', { method: 'POST' }).catch(() => undefined);
      window.location.href = '/login';
    } catch (cause) {
      toast(readError(cause, dict), 'error');
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ShieldOff className="h-3.5 w-3.5" />
        {dict.logoutAll}
      </Button>
      <Dialog
        open={open}
        onClose={() => (busy ? undefined : setOpen(false))}
        title={dict.logoutAll}
        description={dict.logoutText}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            {dict.cancel}
          </Button>
          <Button variant="danger" onClick={signOut} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {dict.logoutAll}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
