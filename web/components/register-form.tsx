'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { sessionPost } from '@/lib/client';
import type { AuthResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { FormError, readError } from '@/components/login-form';

export function RegisterForm({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
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
      const result = await sessionPost<AuthResult>('register', { name, email, password });
      setVerificationToken(result.verificationToken ?? null);
      setDone(true);
      router.refresh();
    } catch (cause) {
      setError(readError(cause, dict));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-mint/25 bg-mint/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-mint">
            <CheckCircle2 className="h-4 w-4" />
            {dict.verificationRequired}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{dict.verifyEmailSent}</p>
        </div>
        {verificationToken ? (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
            <p className="font-semibold uppercase tracking-wide text-muted-foreground">
              {dict.devToken}
            </p>
            <Link
              href={`/verify-email?token=${encodeURIComponent(verificationToken)}`}
              className="mt-1 block break-all text-brand hover:underline"
            >
              /verify-email?token={verificationToken.slice(0, 24)}…
            </Link>
          </div>
        ) : null}
        <Button size="lg" className="w-full" onClick={() => router.push('/dashboard')}>
          {dict.dashboard}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={dict.name}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
        />
      </Field>
      <Field label={dict.email}>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </Field>
      <Field label={dict.password} hint={dict.passwordHint}>
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
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {busy ? dict.creatingAccount : dict.register}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {dict.haveAccount}{' '}
        <Link href="/login" className="text-brand hover:underline">
          {dict.login}
        </Link>
      </p>
    </form>
  );
}
