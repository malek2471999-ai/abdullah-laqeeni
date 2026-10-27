'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Clock,
  Link2,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  Smartphone,
} from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import type { PairingRequest } from '@/lib/types';
import { api } from '@/lib/client';
import { readError } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Spinner } from '@/components/ui/feedback';

function secondsLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 1000));
}

export function PairPanel({ dict }: { dict: Dictionary }) {
  const [pairing, setPairing] = useState<PairingRequest | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!pairing) return;
    setLeft(secondsLeft(pairing.expiresAt));
    const timer = window.setInterval(() => {
      setLeft(secondsLeft(pairing.expiresAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pairing]);

  useEffect(() => {
    if (!pairing) {
      setQr(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const QRCode = (await import('qrcode')).default;
      const data = await QRCode.toDataURL(pairing.qrPayload, {
        width: 480,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#071426', light: '#ffffff' },
      });
      if (!cancelled) setQr(data);
    })().catch(() => {
      if (!cancelled) setQr(null);
    });
    return () => {
      cancelled = true;
    };
  }, [pairing]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await api<PairingRequest>('devices/pairing', { method: 'POST' });
      setPairing(result);
    } catch (cause) {
      setError(readError(cause, dict));
    } finally {
      setBusy(false);
    }
  };

  const expired = pairing !== null && left <= 0;
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-brand" />
            {dict.generateCode}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{dict.pairSubtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pairing ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <QrCode className="h-7 w-7" />
              </span>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">{dict.pairQrHint}</p>
              <Button className="mt-5" onClick={generate} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {dict.generateCode}
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-brand/25 bg-brand/5 p-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">
                  {dict.pairingCode}
                </p>
                <p
                  className="mt-1 select-all font-mono text-4xl font-bold tracking-[0.18em]"
                  dir="ltr"
                >
                  {pairing.code}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <CopyButton value={pairing.code} dict={dict} label={dict.copy} />
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {expired
                      ? dict.pairExpired
                      : `${dict.codeExpires} ${minutes}:${String(seconds).padStart(2, '0')}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white p-4">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr}
                    alt={dict.pairQr}
                    className="h-56 w-56 rounded-xl"
                    width={224}
                    height={224}
                  />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center rounded-xl bg-muted">
                    <Spinner className="text-brand" />
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">{dict.pairQrHint}</p>
              </div>

              {expired ? (
                <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-xs text-danger">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {dict.pairExpired}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={generate} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {dict.newCode}
                </Button>
                <CopyButton value={pairing.qrPayload} dict={dict} label={dict.openOnPhone} />
              </div>
            </>
          )}

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-5">{error}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-mint" />
              {dict.pairInstructions}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="space-y-3">
              {[dict.pairStepOne, dict.pairStepTwo, dict.pairStepThree].map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-violet" />
              {dict.enterCode}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
            <p className="leading-6">{dict.pairQrHint}</p>
            <div className="flex items-start gap-2 rounded-xl border border-mint/25 bg-mint/5 px-3 py-2.5 text-xs text-mint">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {dict.pairStepThree}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
