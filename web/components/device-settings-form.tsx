'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellRing,
  History,
  Loader2,
  MessageSquare,
  Save,
  Smartphone,
  Trash2,
} from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import type { Device } from '@/lib/types';
import { api } from '@/lib/client';
import { readError } from '@/components/login-form';
import { useToast } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export function DeviceSettingsForm({ device, dict }: { device: Device; dict: Dictionary }) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(device.name);
  const [lostMessage, setLostMessage] = useState(device.lostMessage ?? '');
  const [contactPhone, setContactPhone] = useState(device.contactPhone ?? '');
  const [historyEnabled, setHistoryEnabled] = useState(device.locationHistoryEnabled);
  const [retentionDays, setRetentionDays] = useState(device.historyRetentionDays);
  const [notifyOnReconnect, setNotifyOnReconnect] = useState(device.notifyOnReconnect);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('save');
    try {
      await api<Device>(`devices/${device.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          lostMessage: lostMessage.trim(),
          contactPhone: contactPhone.trim(),
          locationHistoryEnabled: historyEnabled,
          historyRetentionDays: retentionDays,
          notifyOnReconnect,
        }),
      });
      toast(dict.settingsSaved, 'success');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await api(`devices/${device.id}`, { method: 'DELETE' });
      toast(dict.deviceDeleted, 'success');
      router.push('/devices');
      router.refresh();
    } catch (cause) {
      toast(readError(cause, dict), 'error');
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="space-y-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.deviceSettingsTitle}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.deviceSettingsSubtitle}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Field label={dict.deviceName}>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
                disabled={busy !== null}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <MessageSquare className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.lostModeMessage}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.lostDescription}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <Field label={dict.lostMessage}>
              <Textarea
                value={lostMessage}
                onChange={(event) => setLostMessage(event.target.value)}
                maxLength={300}
                placeholder={dict.defaultLostMessage}
                disabled={busy !== null}
              />
            </Field>
            <Field label={`${dict.contactPhone} (${dict.optional})`}>
              <Input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                maxLength={80}
                inputMode="tel"
                placeholder="+90 5xx xxx xx xx"
                disabled={busy !== null}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <History className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.locationHistory}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.historySubtitle}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
              <div>
                <p className="text-sm font-medium">{dict.historyEnabled}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{dict.historyDisabledText}</p>
              </div>
              <Switch
                checked={historyEnabled}
                onCheckedChange={setHistoryEnabled}
                disabled={busy !== null}
                label={dict.historyEnabled}
              />
            </div>
            <Field label={dict.retentionDays} hint={`1-90 ${dict.days}`}>
              <Select
                value={retentionDays}
                onChange={(event) => setRetentionDays(Number(event.target.value))}
                disabled={busy !== null || !historyEnabled}
              >
                {[7, 14, 30, 60, 90].map((days) => (
                  <option key={days} value={days}>
                    {days} {dict.days}
                  </option>
                ))}
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
              <BellRing className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.notifications}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.notificationsSubtitle}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
              <p className="text-sm font-medium">{dict.notifyOnReconnect}</p>
              <Switch
                checked={notifyOnReconnect}
                onCheckedChange={setNotifyOnReconnect}
                disabled={busy !== null}
                label={dict.notifyOnReconnect}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy !== null || !name.trim()}>
            {busy === 'save' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {dict.saveSettings}
          </Button>
        </div>
      </form>

      <Card className="border-danger/30">
        <CardHeader className="flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <Trash2 className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-danger">{dict.deleteDevice}</CardTitle>
            <p className="text-xs text-muted-foreground">{dict.deleteDeviceText}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
          <p className="text-xs text-danger/80">{dict.deleteDeviceConfirm}</p>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            {dict.deleteDevice}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => (busy ? undefined : setDeleteOpen(false))}
        title={dict.deleteDevice}
        description={dict.deleteDeviceText}
      >
        <div className="space-y-4">
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {dict.deleteDeviceConfirm}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy !== null}>
              {dict.cancel}
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy !== null}>
              {busy === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {dict.deleteDevice}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
