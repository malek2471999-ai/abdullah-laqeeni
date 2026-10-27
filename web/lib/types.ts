export type CommandType =
  | 'RING'
  | 'STOP_RING'
  | 'LOCATE'
  | 'LOST_MODE_ON'
  | 'LOST_MODE_OFF'
  | 'MESSAGE'
  | 'VIBRATE'
  | 'FLASH'
  | 'REQUEST_STATUS';

export type CommandStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'ACKNOWLEDGED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  altitudeMeters?: number | null;
  speedMps?: number | null;
  headingDegrees?: number | null;
  source: string;
  isMock: boolean;
  capturedAt: string;
  recordedAt?: string;
}

export interface Device {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  androidVersion: string;
  appVersion: string | null;
  online: boolean;
  lastSeenAt: string | null;
  pairedAt: string;
  lostMode: boolean;
  lostMessage: string | null;
  contactPhone: string | null;
  locationHistoryEnabled: boolean;
  historyRetentionDays: number;
  notifyOnReconnect: boolean;
  batteryLevel: number | null;
  charging: boolean | null;
  networkConnected: boolean | null;
  networkType: string | null;
  lastSyncAt: string | null;
  location: DeviceLocation | null;
  locationAgeSeconds: number | null;
  locationStale: boolean;
  locationLive: boolean;
  createdAt: string;
}

export interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  isMock: boolean;
  capturedAt: string;
}

export interface DeviceHistory {
  deviceId: string;
  historyEnabled: boolean;
  retentionDays: number;
  points: LocationPoint[];
}

export interface RemoteCommand {
  id: string;
  type: CommandType;
  status: CommandStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  acknowledgedAt?: string | null;
  expiresAt: string;
  failureReason?: string | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  deviceId: string | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
  device?: { id: string; name: string } | null;
}

export interface Session {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

export interface SecurityEvent {
  id: string;
  type: string;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PairingRequest {
  pairingId: string;
  code: string;
  normalizedCode: string;
  expiresAt: string;
  qrPayload: string;
}

export interface AuthResult {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: User;
  twoFactorRequired?: boolean;
  challengeToken?: string;
  verificationToken?: string;
}

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export interface UnreadCount {
  count: number;
}
