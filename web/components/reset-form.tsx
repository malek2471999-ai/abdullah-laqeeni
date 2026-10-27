'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { sessionPost } from '@/lib/client';
import { Button, buttonClasses } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { FormError, readError } from '@/components/login-form';

export function ResetForm({
  dict,
  token,
}: {
  dict: Dictionary;
  token: string;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError(dict.passwordMismatch);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sessionPost('reset-password', { token, password });
      setDone(true);
    } catch (cause) {
      setError(readError(cause, dict));
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <FormError message={dict.invalidToken} />
        <Link href="/forgot-password" className="block text-center text-sm text-brand hover:underline">
          {dict.forgotPassword}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-mint/25 bg-mint/10 p-4 text-sm text-mint">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            {dict.resetDone}
          </div>
        </div>
        <Link href="/login" className={buttonClasses({ size: 'lg', className: 'w-full' })}>
          {dict.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={dict.newPassword} hint={dict.passwordHint}>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>
      <Field label={dict.confirmPassword}>
        <Input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>
      {error ? <FormError message={error} /> : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {dict.resetPassword}
      </Button>
      <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
        {dict.backToLogin}
      </Link>
    </form>
  );
}
