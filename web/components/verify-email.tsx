'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { sessionPost } from '@/lib/client';
import { buttonClasses } from '@/components/ui/button';

export function VerifyEmail({ dict, token }: { dict: Dictionary; token: string }) {
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    let active = true;
    sessionPost('verify-email', { token })
      .then(() => {
        if (active) setState('done');
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="space-y-5 text-center">
      {state === 'loading' ? (
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" />
      ) : state === 'done' ? (
        <CheckCircle2 className="mx-auto h-12 w-12 text-mint" />
      ) : (
        <XCircle className="mx-auto h-12 w-12 text-danger" />
      )}
      <p className="text-sm text-muted-foreground">
        {state === 'loading' ? dict.loading : state === 'done' ? dict.verificationDone : dict.invalidToken}
      </p>
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className={buttonClasses({ className: 'w-full' })}>
          {dict.dashboard}
        </Link>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          {dict.backToLogin}
        </Link>
      </div>
    </div>
  );
}
