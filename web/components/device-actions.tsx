'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BellOff,
  BellRing,
  Flashlight,
  Loader2,
  MapPin,
  MessageSquare,
  Radar,
  ShieldAlert,
  ShieldOff,
  Vibrate,
} from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import type { Device, RemoteCommand } from '@/lib/types';
import { api } from '@/lib/client';
import { randomIdempotencyKey } from '@/lib/utils';
import { useToast } from '@/components/providers';
import { readError } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type DialogKind = 'ring' | 'message' | 'lost' | 'vibrate' | 'flash' | null;

export function DeviceActions({ device, dict }: { device: Device; dict: Dictionary }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [message, setMessage] = useState(device.lostMessage ?? dict.defaultLostMessage);
  const [phone, setPhone] = useState(device.contactPhone ?? '');
  const [ringSeconds, setRingSeconds] = useState(180);
  const [vibration, setVibration] = useState(true);
  const [torch, setTorch] = useState(true);
  const [shortSeconds, setShortSeconds] = useState(10);

  const close = () => {
    if (busy) return;
    setDialog(null);
  };

  const send = async (
    action: string,
    body: Record<string, unknown> | undefined,
    success: string,
    key: string,
  ) => {
    setBusy(key);
    try {
      await api<RemoteCommand>(`devices/${device.id}/${action}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
        idempotencyKey: randomIdempotencyKey(`${device.id}-${action}`),
      });
      toast(success, 'success');
      setDialog(null);
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const openLost = () => {
    if (device.lostMode) {
      void send('lost-mode', { enabled: false }, dict.lostDisabled, 'lost-mode');
      return;
    }
    setMessage(device.lostMessage ?? dict.defaultLostMessage);
    setPhone(device.contactPhone ?? '');
    setDialog('lost');
  };

  const openShort = (kind: 'vibrate' | 'flash') => {
    setShortSeconds(kind === 'vibrate' ? 10 : 15);
    setDialog(kind);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.quickActions}</CardTitle>
        <p className="text-xs text-muted-foreground">{dict.statusDescription}</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {!device.online ? (
          <div className="flex items-start gap-2 rounded-xl border border-violet/25 bg-violet/10 px-3 py-2.5 text-xs text-violet">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-5">
              <strong className="font-semibold">{dict.offlineWarning}.</strong>{' '}
              {dict.offlineWarningText}
            </span>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="danger"
            size="lg"
            className="justify-start"
            onClick={() => setDialog('ring')}
            disabled={busy !== null}
          >
            {busy === 'ring' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
            <span className="flex flex-col items-start leading-4">
              <span>{dict.ring}</span>
              <span className="text-[10px] font-normal opacity-80">{dict.ringDescription}</span>
            </span>
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="justify-start"
            onClick={() => void send('locate', undefined, dict.locateSent, 'locate')}
            disabled={busy !== null}
          >
            {busy === 'locate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            <span className="flex flex-col items-start leading-4">
              <span>{dict.locate}</span>
              <span className="text-[10px] font-normal opacity-80">{dict.locateDescription}</span>
            </span>
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={() => void send('stop-ring', undefined, dict.lostDisabled, 'stop-ring')}
            disabled={busy !== null}
          >
            {busy === 'stop-ring' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellOff className="h-4 w-4" />}
            {dict.stopRing}
          </Button>
          <Button
            variant={device.lostMode ? 'success' : 'outline'}
            onClick={openLost}
            disabled={busy !== null}
          >
            {busy === 'lost-mode' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : device.lostMode ? (
              <ShieldOff className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            {device.lostMode ? dict.lostModeOff : dict.lostModeOn}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
          <Button variant="ghost" className="justify-start" onClick={() => setDialog('message')} disabled={busy !== null}>
            <MessageSquare className="h-4 w-4" />
            {dict.message}
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => openShort('vibrate')} disabled={busy !== null}>
            <Vibrate className="h-4 w-4" />
            {dict.vibrate}
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => openShort('flash')} disabled={busy !== null}>
            <Flashlight className="h-4 w-4" />
            {dict.flash}
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => void send('request-status', undefined, dict.statusRequested, 'status')}
            disabled={busy !== null}
          >
            {busy === 'status' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
            {dict.requestStatus}
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={dialog === 'ring'}
        onClose={close}
        title={dict.ring}
        description={dict.ringDescription}
      >
        <div className="space-y-4">
          <Field label={dict.seconds}>
            <Select
              value={ringSeconds}
              onChange={(event) => setRingSeconds(Number(event.target.value))}
              disabled={busy !== null}
            >
              {[30, 60, 120, 180, 300].map((value) => (
                <option key={value} value={value}>
                  {value} {dict.seconds}
                </option>
              ))}
            </Select>
          </Field>
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>{dict.vibrate}</span>
              <Switch
                checked={vibration}
                onCheckedChange={setVibration}
                disabled={busy !== null}
                label={dict.vibrate}
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>{dict.flash}</span>
              <Switch checked={torch} onCheckedChange={setTorch} disabled={busy !== null} label={dict.flash} />
            </label>
          </div>
          {!device.online ? (
            <p className="rounded-xl border border-violet/25 bg-violet/10 px-3 py-2 text-xs text-violet">
              {dict.offlineWarningText}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={busy !== null}>
              {dict.cancel}
            </Button>
            <Button
              variant="danger"
              disabled={busy !== null}
              onClick={() =>
                void send(
                  'ring',
                  {
                    durationSeconds: ringSeconds,
                    sound: 'siren',
                    vibration,
                    flash: torch,
                  },
                  dict.ringSent,
                  'ring',
                )
              }
            >
              {busy === 'ring' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              {dict.ring}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={dialog === 'message'}
        onClose={close}
        title={dict.message}
        description={dict.messageDescription}
      >
        <div className="space-y-4">
          <Field label={dict.message}>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={300}
              required
              disabled={busy !== null}
            />
          </Field>
          <Field label={`${dict.contactPhone} (${dict.optional})`}>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={80}
              inputMode="tel"
              placeholder="+90 5xx xxx xx xx"
              disabled={busy !== null}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={busy !== null}>
              {dict.cancel}
            </Button>
            <Button
              disabled={busy !== null || !message.trim()}
              onClick={() =>
                void send(
                  'message',
                  { message: message.trim(), contactPhone: phone.trim() || undefined },
                  dict.messageSent,
                  'message',
                )
              }
            >
              {busy === 'message' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              {dict.message}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={dialog === 'lost'}
        onClose={close}
        title={dict.lostModeOn}
        description={dict.lostDescription}
      >
        <div className="space-y-4">
          <Field label={dict.lostMessage}>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={300}
              disabled={busy !== null}
            />
          </Field>
          <Field label={`${dict.contactPhone} (${dict.optional})`}>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={80}
              inputMode="tel"
              placeholder="+90 5xx xxx xx xx"
              disabled={busy !== null}
            />
          </Field>
          {!device.online ? (
            <p className="rounded-xl border border-violet/25 bg-violet/10 px-3 py-2 text-xs text-violet">
              {dict.offlineWarningText}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={busy !== null}>
              {dict.cancel}
            </Button>
            <Button
              variant="danger"
              disabled={busy !== null || !message.trim()}
              onClick={() =>
                void send(
                  'lost-mode',
                  {
                    enabled: true,
                    message: message.trim(),
                    contactPhone: phone.trim() || undefined,
                  },
                  dict.lostEnabled,
                  'lost-mode',
                )
              }
            >
              {busy === 'lost-mode' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              {dict.lostModeOn}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={dialog === 'vibrate' || dialog === 'flash'}
        onClose={close}
        title={dialog === 'flash' ? dict.flash : dict.vibrate}
        description={dialog === 'flash' ? dict.flashDescription : dict.vibrateDescription}
      >
        <div className="space-y-4">
          <Field label={dict.seconds}>
            <Select
              value={shortSeconds}
              onChange={(event) => setShortSeconds(Number(event.target.value))}
              disabled={busy !== null}
            >
              {(dialog === 'flash' ? [5, 15, 30, 60] : [5, 10, 30, 60]).map((value) => (
                <option key={value} value={value}>
                  {value} {dict.seconds}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={busy !== null}>
              {dict.cancel}
            </Button>
            <Button
              disabled={busy !== null}
              onClick={() =>
                void send(
                  dialog === 'flash' ? 'flash' : 'vibrate',
                  { durationSeconds: shortSeconds },
                  dialog === 'flash' ? dict.flashSent : dict.vibrateSent,
                  dialog === 'flash' ? 'flash' : 'vibrate',
                )
              }
            >
              {busy === 'flash' || busy === 'vibrate' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : dialog === 'flash' ? (
                <Flashlight className="h-4 w-4" />
              ) : (
                <Vibrate className="h-4 w-4" />
              )}
              {dialog === 'flash' ? dict.flash : dict.vibrate}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
