import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Dictionary, Locale } from './i18n';
import type { CommandStatus, CommandType } from './types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const dateLocales: Record<Locale, string> = {
  en: 'en-GB',
  ar: 'ar',
  fr: 'fr-FR',
};

export function formatDate(value: string | null | undefined, locale: Locale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(dateLocales[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatTime(value: string | null | undefined, locale: Locale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(dateLocales[locale], { timeStyle: 'short' }).format(date);
}

export function relativeTime(
  value: string | null | undefined,
  locale: Locale,
): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(dateLocales[locale], { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 60) return formatter.format(seconds, 'second');
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (abs < 86_400) return formatter.format(Math.round(seconds / 3600), 'hour');
  return formatter.format(Math.round(seconds / 86_400), 'day');
}

export function formatNumber(value: number | null | undefined, locale: Locale): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(dateLocales[locale]).format(value);
}

export function formatCoord(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(6);
}

export function deviceTitle(device: { name: string; manufacturer: string; model: string }): string {
  return device.name || `${device.manufacturer} ${device.model}`.trim();
}

export function commandLabelKey(type: CommandType): keyof Dictionary {
  const map: Record<CommandType, keyof Dictionary> = {
    RING: 'ring',
    STOP_RING: 'stopRing',
    LOCATE: 'locate',
    LOST_MODE_ON: 'lostModeOn',
    LOST_MODE_OFF: 'lostModeOff',
    MESSAGE: 'message',
    VIBRATE: 'vibrate',
    FLASH: 'flash',
    REQUEST_STATUS: 'requestStatus',
  };
  return map[type];
}

export function statusTone(status: CommandStatus): string {
  switch (status) {
    case 'ACKNOWLEDGED':
      return 'border-mint/30 bg-mint/10 text-mint';
    case 'FAILED':
    case 'EXPIRED':
      return 'border-danger/30 bg-danger/10 text-danger';
    case 'DELIVERED':
      return 'border-brand/30 bg-brand/10 text-brand';
    default:
      return 'border-violet/30 bg-violet/10 text-violet';
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function randomIdempotencyKey(prefix: string): string {
  const random = Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}-${random}`;
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

const notificationKeys: Record<string, keyof Dictionary> = {
  DEVICE_ONLINE: 'notifDeviceOnline',
  DEVICE_OFFLINE: 'notifDeviceOffline',
  COMMAND_ACK: 'notifCommandAck',
  LOCATION_UPDATE: 'notifLocationUpdate',
  LOST_MODE: 'notifLostMode',
  BATTERY_LOW: 'notifBatteryLow',
  SECURITY: 'notifSecurity',
};

export function notificationLabel(type: string, dict: Dictionary): string {
  const key = notificationKeys[type];
  return key ? dict[key] : type.replace(/_/g, ' ').toLowerCase();
}

const securityEventKeys: Record<string, keyof Dictionary> = {
  LOGIN_SUCCESS: 'eventLoginSuccess',
  LOGIN_FAILED: 'eventLoginFailed',
  REGISTER: 'eventRegister',
  PASSWORD_RESET: 'eventPasswordReset',
  PASSWORD_CHANGED: 'eventPasswordChanged',
  LOGOUT_ALL: 'eventLogoutAll',
  DEVICE_PAIRED: 'eventDevicePaired',
  DEVICE_UNPAIRED: 'eventDeviceUnpaired',
  COMMAND_SENT: 'eventCommandSent',
  TWO_FACTOR_ENABLED: 'eventTwoFactorEnabled',
  TWO_FACTOR_DISABLED: 'eventTwoFactorDisabled',
};

export function securityEventLabel(type: string, dict: Dictionary): string {
  const key = securityEventKeys[type];
  return key ? dict[key] : type.replace(/_/g, ' ').toLowerCase();
}
