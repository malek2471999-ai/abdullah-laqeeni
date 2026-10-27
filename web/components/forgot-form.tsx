'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { sessionPost } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { FormError, readError } from '@/components/login-form';

export function ForgotForm({ dict }: { dict: Dictionary }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await sessionPost<{ ok: boolean; resetToken?: string }>('forgot-password', {
        email,
      });
      setSent(true);
      setResetToken(result.resetToken ?? null);
    } catch (cause) {
      setError(readError(cause, dict));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-mint/25 bg-mint/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-mint">
            <MailCheck className="h-4 w-4" />
            {dict.sendResetLink}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{dict.resetSent}</p>
        </div>
        {resetToken ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
            <p className="font-semibold uppercase tracking-wide text-muted-foreground">
              {dict.devToken}
            </p>
            <Link
              href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              className="mt-1 block break-all text-brand hover:underline"
            >
              {dict.resetPassword} →
            </Link>
          </div>
        ) : null}
        <Link href="/login" className="block text-center text-sm text-brand hover:underline">
          {dict.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={dict.email}>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </Field>
      {error ? <FormError message={error} /> : null}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {dict.sendResetLink}
      </Button>
      <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
        {dict.backToLogin}
      </Link>
    </form>
  );
}
