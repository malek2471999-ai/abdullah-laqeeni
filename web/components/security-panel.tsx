'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Fingerprint,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  MailCheck,
  MonitorSmartphone,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import type { SecurityEvent, Session, User } from '@/lib/types';
import { api } from '@/lib/client';
import { readError } from '@/components/login-form';
import { useToast } from '@/components/providers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/input';
import { CopyButton } from '@/components/copy-button';
import { formatDate, relativeTime, securityEventLabel } from '@/lib/utils';

interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export function SecurityPanel({
  user,
  sessions,
  events,
  locale,
  dict,
}: {
  user: User;
  sessions: Session[];
  events: SecurityEvent[];
  locale: 'en' | 'ar' | 'fr';
  dict: Dictionary;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled);
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [setupQr, setSetupQr] = useState<string | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (!setup) {
      setSetupQr(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const QRCode = (await import('qrcode')).default;
      const data = await QRCode.toDataURL(setup.otpauthUrl, {
        width: 420,
        margin: 1,
        color: { dark: '#071426', light: '#ffffff' },
      });
      if (!cancelled) setSetupQr(data);
    })().catch(() => {
      if (!cancelled) setSetupQr(null);
    });
    return () => {
      cancelled = true;
    };
  }, [setup]);

  const startSetup = async () => {
    setBusy('setup');
    try {
      const result = await api<TwoFactorSetup>('auth/2fa/setup', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setSetup(result);
      toast(dict.setupStarted, 'info');
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const enable = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('enable');
    try {
      await api('auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: enableCode }),
      });
      setTwoFactor(true);
      setSetup(null);
      setEnableCode('');
      toast(dict.enabledSuccess, 'success');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const disable = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('disable');
    try {
      await api('auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      setTwoFactor(false);
      setDisablePassword('');
      setDisableCode('');
      toast(dict.disabledSuccess, 'success');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast(dict.passwordMismatch, 'error');
      return;
    }
    setBusy('password');
    try {
      await api('auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast(dict.passwordChanged, 'success');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (session: Session) => {
    setBusy(session.id);
    try {
      await api(`auth/sessions/${session.id}`, { method: 'DELETE' });
      if (session.current) {
        await fetch('/api/session/logout', { method: 'POST' }).catch(() => undefined);
        window.location.href = '/login';
        return;
      }
      toast(dict.saved, 'success');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const revokeOthers = async () => {
    setBusy('others');
    try {
      await api('auth/logout-all', { method: 'POST', body: JSON.stringify({}) });
      toast(dict.saved, 'success');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const resendVerification = async () => {
    setBusy('verify');
    try {
      await api('auth/resend-verification', { method: 'POST', body: JSON.stringify({}) });
      toast(dict.verificationResent, 'success');
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('delete');
    try {
      await api('auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword }),
      });
      await fetch('/api/session/logout', { method: 'POST' }).catch(() => undefined);
      window.location.href = '/login';
    } catch (cause) {
      toast(readError(cause, dict), 'error');
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.accountInfo}</CardTitle>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge tone={user.emailVerified ? 'mint' : 'violet'}>
            {user.emailVerified ? (
              <BadgeCheck className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {user.emailVerified ? dict.emailVerified : dict.emailNotVerified}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0 text-sm">
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {dict.createdAt}: {formatDate(user.createdAt, locale)}
            </p>
          </div>
          {!user.emailVerified ? (
            <Button
              size="sm"
              variant="outline"
              onClick={resendVerification}
              disabled={busy !== null}
            >
              {busy === 'verify' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MailCheck className="h-3.5 w-3.5" />
              )}
              {dict.resendVerification}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
                <Fingerprint className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>{dict.twoFactor}</CardTitle>
                <p className="text-xs text-muted-foreground">{dict.securitySubtitle}</p>
              </div>
            </div>
            <Badge tone={twoFactor ? 'mint' : 'muted'}>
              {twoFactor ? dict.enabled : dict.disabled}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {twoFactor ? (
              <form onSubmit={disable} className="space-y-3">
                <p className="text-xs leading-5 text-muted-foreground">{dict.disableText}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={dict.password}>
                    <Input
                      type="password"
                      value={disablePassword}
                      onChange={(event) => setDisablePassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </Field>
                  <Field label={dict.code}>
                    <Input
                      value={disableCode}
                      onChange={(event) =>
                        setDisableCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      required
                    />
                  </Field>
                </div>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={busy !== null || disableCode.length !== 6 || !disablePassword}
                >
                  {busy === 'disable' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldOff className="h-3.5 w-3.5" />
                  )}
                  {dict.disable}
                </Button>
              </form>
            ) : setup ? (
              <form onSubmit={enable} className="space-y-3">
                <p className="text-xs leading-5 text-muted-foreground">{dict.twoFactorSetupText}</p>
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-3 sm:flex-row sm:items-start">
                  {setupQr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={setupQr}
                      alt={dict.twoFactorSetup}
                      className="h-36 w-36 rounded-xl"
                      width={144}
                      height={144}
                    />
                  ) : (
                    <div className="flex h-36 w-36 items-center justify-center rounded-xl bg-muted">
                      <Loader2 className="h-5 w-5 animate-spin text-brand" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/70">
                      {dict.twoFactorSecret}
                    </p>
                    <p className="break-all font-mono text-xs font-semibold text-navy" dir="ltr">
                      {setup.secret}
                    </p>
                    <CopyButton value={setup.secret} dict={dict} label={dict.copy} />
                  </div>
                </div>
                <Field label={dict.code}>
                  <Input
                    value={enableCode}
                    onChange={(event) =>
                      setEnableCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="text-center text-lg tracking-[0.4em]"
                    required
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={busy !== null || enableCode.length !== 6}
                  >
                    {busy === 'enable' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    {dict.enable}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSetup(null);
                      setEnableCode('');
                    }}
                    disabled={busy !== null}
                  >
                    {dict.cancel}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <p className="text-xs leading-5 text-muted-foreground">{dict.twoFactorSetupText}</p>
                <Button size="sm" onClick={startSetup} disabled={busy !== null}>
                  {busy === 'setup' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5" />
                  )}
                  {dict.twoFactorSetup}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/10 text-mint">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>{dict.passwordTitle}</CardTitle>
                <p className="text-xs text-muted-foreground">{dict.passwordSubtitle}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={changePassword} className="space-y-3">
              <Field label={dict.currentPassword}>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label={dict.newPassword} hint={dict.passwordHint}>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={10}
                  required
                />
              </Field>
              <Field
                label={dict.confirmPassword}
                error={confirmPassword && newPassword !== confirmPassword ? dict.passwordMismatch : undefined}
              >
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={10}
                  required
                />
              </Field>
              <Button
                type="submit"
                size="sm"
                disabled={
                  busy !== null ||
                  !currentPassword ||
                  newPassword.length < 10 ||
                  newPassword !== confirmPassword
                }
              >
                {busy === 'password' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {dict.changePassword}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <MonitorSmartphone className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.sessions}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.sessionsSubtitle}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={revokeOthers}
            disabled={busy !== null || sessions.length <= 1}
          >
            {busy === 'others' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldOff className="h-3.5 w-3.5" />
            )}
            {dict.revokeOthers}
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{dict.noSessions}</p>
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    {session.userAgent?.toLowerCase().includes('mobile') ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Laptop className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {session.userAgent?.slice(0, 70) || dict.unknown}
                      </p>
                      {session.current ? <Badge tone="mint">{dict.currentSession}</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground" dir="ltr">
                      {session.ip || dict.unknown} · {dict.lastUsed}:{' '}
                      {relativeTime(session.lastUsedAt, locale)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revoke(session)}
                    disabled={busy !== null}
                  >
                    {busy === session.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldOff className="h-3.5 w-3.5 text-danger" />
                    )}
                    {dict.revoke}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <CardTitle>{dict.events}</CardTitle>
            <p className="text-xs text-muted-foreground">{dict.eventsSubtitle}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{dict.noEvents}</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.slice(0, 20).map((event) => (
                <li key={event.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{securityEventLabel(event.type, dict)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {relativeTime(event.createdAt, locale)}
                      {event.ip ? (
                        <span dir="ltr"> · {event.ip}</span>
                      ) : null}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDate(event.createdAt, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader className="flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <Trash2 className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-danger">{dict.deleteAccount}</CardTitle>
            <p className="text-xs text-muted-foreground">{dict.deleteAccountText}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
          <p className="max-w-xl text-xs leading-5 text-danger/80">{dict.deleteAccountWarning}</p>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            {dict.deleteAccount}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => (busy ? undefined : setDeleteOpen(false))}
        title={dict.deleteAccount}
        description={dict.deleteAccountWarning}
      >
        <form onSubmit={deleteAccount} className="space-y-4">
          <Field label={dict.password}>
            <Input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              autoComplete="current-password"
              required
              autoFocus
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={busy !== null}
            >
              {dict.cancel}
            </Button>
            <Button type="submit" variant="danger" disabled={busy !== null || !deletePassword}>
              {busy === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {dict.deleteForever}
            </Button>
          </div>
        </form>
      </Dialog>

      <p className="flex items-start gap-2 px-1 text-[11px] leading-5 text-muted-foreground">
        <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {dict.disclaimer}
      </p>
    </div>
  );
}
