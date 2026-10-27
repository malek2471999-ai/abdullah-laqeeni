'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowRight, KeyRound, Loader2, LockKeyhole, Mail } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { sessionPost, ClientApiError } from '@/lib/client';
import { safeNextPath } from '@/lib/utils';
import type { AuthResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { GoogleButton } from '@/components/google-button';

export function LoginForm({
  dict,
  googleClientId,
  expired,
}: {
  dict: Dictionary;
  googleClientId?: string;
  expired?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(expired ? dict.sessionExpired : null);
  const [busy, setBusy] = useState(false);

  const finish = () => {
    router.replace(next);
    router.refresh();
  };

  const submitCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await sessionPost<AuthResult>('login', { email, password });
      if (result.twoFactorRequired && result.challengeToken) {
        setChallenge(result.challengeToken);
        setPassword('');
      } else {
        finish();
      }
    } catch (cause) {
      setError(readError(cause, dict));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!challenge) return;
    setBusy(true);
    setError(null);
    try {
      await sessionPost<AuthResult>('2fa', { challengeToken: challenge, code });
      finish();
    } catch (cause) {
      setError(readError(cause, dict));
    } finally {
      setBusy(false);
    }
  };

  if (challenge) {
    return (
      <form onSubmit={submitCode} className="space-y-4">
        <div className="rounded-2xl border border-brand/25 bg-brand/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand">
            <KeyRound className="h-4 w-4" />
            {dict.twoFactorTitle}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{dict.twoFactorSubtitle}</p>
        </div>
        <Field label={dict.code}>
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
        </Field>
        {error ? <FormError message={error} /> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
          {busy ? dict.signingIn : dict.verifyCode}
        </Button>
        <button
          type="button"
          onClick={() => {
            setChallenge(null);
            setCode('');
            setError(null);
          }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {dict.backToLogin}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submitCredentials} className="space-y-4">
        <Field label={dict.email}>
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="ps-9"
              placeholder="you@example.com"
            />
          </div>
        </Field>
        <Field label={dict.password}>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="ps-9"
              placeholder="••••••••••"
            />
          </div>
        </Field>
        {error ? <FormError message={error} /> : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          {busy ? dict.signingIn : dict.login}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-brand hover:underline">
          {dict.forgotPassword}
        </Link>
        <Link href="/register" className="text-muted-foreground hover:text-foreground">
          {dict.createAccount}
        </Link>
      </div>

      {googleClientId ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {dict.orContinue}
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton clientId={googleClientId} dict={dict} onError={setError} onSuccess={finish} />
        </div>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-5">{message}</span>
    </div>
  );
}

export function readError(cause: unknown, dict: Dictionary): string {
  if (cause instanceof ClientApiError) {
    if (cause.status === 429) return dict.tooManyRequests;
    if (cause.status === 0) return dict.networkError;
    if (cause.message && cause.message !== `HTTP ${cause.status}`) return cause.message;
  }
  if (cause instanceof TypeError) return dict.networkError;
  return dict.genericError;
}
