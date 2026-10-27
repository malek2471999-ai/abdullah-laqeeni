# REST API reference

Base URL: `http://localhost:4000` (there is **no** `/api` prefix on the backend; the web dashboard exposes it at `/api/proxy/<path>`).

All request/response bodies are JSON (`Content-Type: application/json`), limited to **128 kB**. Timestamps are ISO-8601 UTC strings. All IDs are UUIDs unless noted.

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Owner: devices](#owner-devices)
- [Owner: commands](#owner-commands)
- [Owner: notifications](#owner-notifications)
- [Device agent API](#device-agent-api)
- [Health](#health)
- [Errors](#errors)
- [Command lifecycle](#command-lifecycle)

---

## Conventions

### Authentication headers

| Scope | Header | Token source |
| --- | --- | --- |
| Owner (dashboard/app) | `Authorization: Bearer <accessToken>` | `POST /auth/login` or `/auth/refresh` |
| Protected phone | `Authorization: Device <deviceId>.<secret>` | Returned **once** by `POST /devices/pair` |

A user token cannot call `/device/*`; a device token cannot call `/devices/*` or `/auth/*`.

### Rate limits

Global: **120 requests/minute per IP** (HTTP `429` when exceeded).

Additional per-route limits (per minute):

| Route | Limit |
| --- | --- |
| `POST /auth/register` | 5 |
| `POST /auth/login`, `/auth/google`, `/auth/2fa/verify` | 10 |
| `POST /auth/refresh` | 30 |
| `POST /auth/forgot-password`, `/auth/reset-password` | 5 |
| `POST /auth/2fa/setup` | 5 |
| `POST /auth/2fa/enable`, `/auth/2fa/disable` | 10 |
| `POST /devices/:id/ring` | 10 s duplicate guard (not a per-minute limit) |
| `POST /devices/:id/locate` | 5 s duplicate guard |

### Idempotency

Every command endpoint accepts an optional header:

```
Idempotency-Key: <any string up to 90 chars>
```

The backend stores the key scoped to the device and command type. Repeating the same request with the same key returns the existing command instead of creating a second one. Without the header, a random key is generated, so every call creates a new command.

### Validation

DTOs are validated with `class-validator`. Unknown fields are rejected (`forbidNonWhitelisted`), so do not send extra properties.

---

## Authentication

### `POST /auth/register`

```json
{ "name": "Abdullah", "email": "owner@example.com", "password": "Str0ngPassw0rd" }
```

Password: 10–128 characters, at least one lowercase, one uppercase, one digit.

`201`:

```json
{
  "accessToken": "eyJ…",
  "refreshToken": "8c1… .Kf2…",
  "user": { "id": "…", "email": "owner@example.com", "name": "Abdullah", "emailVerified": false, "twoFactorEnabled": false, "createdAt": "…" }
}
```

When `EXPOSE_DEV_TOKENS=true` (development), the response also includes `verificationToken` so you can call `/auth/verify-email` without SMTP.

### `POST /auth/login`

```json
{ "email": "owner@example.com", "password": "Str0ngPassw0rd" }
```

`200` with the same session object as register, **or**, when 2FA is enabled:

```json
{ "twoFactorRequired": true, "challengeToken": "eyJ…" }
```

Failed credentials return `401` and are recorded as a `LOGIN_FAILED` security event.

### `POST /auth/2fa/verify`

```json
{ "challengeToken": "eyJ…", "code": "123456" }
```

`200`: session object (`accessToken`, `refreshToken`, `user`). The challenge token is signed with the access secret and expires quickly; it is not a session.

### `POST /auth/google`

```json
{ "idToken": "<Google ID token>" }
```

Enabled only when `GOOGLE_CLIENT_ID` is set on the backend. Verifies the token audience, then creates/links the account by e-mail.

### `POST /auth/refresh`

```json
{ "refreshToken": "8c1… .Kf2…" }
```

Rotates the refresh token and returns a new session object. Reusing an old (rotated) refresh token revokes the session and returns `401`.

### `GET /auth/me`

Bearer. Returns the public user:

```json
{ "id": "…", "email": "…", "name": "…", "emailVerified": true, "twoFactorEnabled": false, "createdAt": "…" }
```

### `POST /auth/logout` · `POST /auth/logout-all`

Bearer. Logout revokes the current session; logout-all revokes every **other** session and returns `{ "revoked": 2 }`.

### `GET /auth/sessions`

Bearer. Returns active sessions, newest use first:

```json
[
  { "id": "…", "userAgent": "…", "ip": "…", "createdAt": "…", "lastUsedAt": "…", "expiresAt": "…", "current": true }
]
```

### `DELETE /auth/sessions/:id`

Bearer. Revokes one of your sessions (`{ "ok": true }`). Revoking the current session is allowed.

### `POST /auth/password`

Bearer.

```json
{ "currentPassword": "old", "newPassword": "NewStr0ngPass" }
```

Changes the password and revokes other sessions. Returns `{ "ok": true }`.

### `POST /auth/forgot-password`

```json
{ "email": "owner@example.com" }
```

Always returns `{ "ok": true }`. With `EXPOSE_DEV_TOKENS=true` it may include `resetToken`.

### `POST /auth/reset-password`

```json
{ "token": "<reset token>", "password": "NewStr0ngPass" }
```

Revokes all sessions on success. `{ "ok": true }`.

### `POST /auth/verify-email`

```json
{ "token": "<verification token>" }
```

`{ "ok": true }`. Tokens are single-use and expire after 30 minutes.

### `POST /auth/resend-verification`

Bearer. Re-sends the verification e-mail; may include `verificationToken` in development.

### 2FA management

| Route | Auth | Body | Result |
| --- | --- | --- | --- |
| `POST /auth/2fa/setup` | Bearer | – | `{ "secret": "BASE32", "otpauthUrl": "otpauth://totp/…" }` |
| `POST /auth/2fa/enable` | Bearer | `{ "code": "123456" }` | `{ "ok": true }` |
| `POST /auth/2fa/disable` | Bearer | `{ "password": "…", "code": "123456" }` | `{ "ok": true }` |

`setup` stores the secret encrypted (AES-256-GCM) but does **not** enable 2FA until a valid code is submitted.

### `DELETE /auth/account`

Bearer.

```json
{ "password": "Str0ngPassw0rd" }
```

Deletes the account: devices, location data, notifications, pairings, e-mail tokens and security events are removed, sessions are revoked, and the user row is anonymised (`deleted+<id>@laqeeni.invalid`). Returns `{ "ok": true }`.

### `GET /auth/security-events`

Bearer. Last 100 events:

```json
[{ "id": "…", "type": "LOGIN_SUCCESS", "ip": "…", "userAgent": "…", "metadata": {}, "createdAt": "…" }]
```

Types: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `REGISTER`, `PASSWORD_RESET`, `PASSWORD_CHANGED`, `LOGOUT_ALL`, `DEVICE_PAIRED`, `DEVICE_UNPAIRED`, `COMMAND_SENT`, `TWO_FACTOR_ENABLED`, `TWO_FACTOR_DISABLED`.

---

## Owner: devices

### `POST /devices/pairing`

Bearer. Cancels any previous unused code for the account, then creates one.

```json
{
  "pairingId": "…",
  "code": "AB3D-9KLM",
  "normalizedCode": "AB3D9KLM",
  "expiresAt": "2026-10-27T12:10:00.000Z",
  "qrPayload": "laqeeni://pair?code=AB3D9KLM"
}
```

Codes use the unambiguous alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, expire after **10 minutes**, and are stored only as HMAC hashes.

### `POST /devices/pair`

Bearer. Called **on the phone being protected**, signed into the same account.

```json
{
  "code": "AB3D-9KLM",
  "name": "Abdullah's phone",
  "manufacturer": "Samsung",
  "model": "SM-S911B",
  "androidVersion": "14",
  "appVersion": "1.0.0",
  "fcmToken": "optional"
}
```

`201`:

```json
{
  "device": { "id": "…", "name": "Abdullah's phone", "online": true, "…": "…" },
  "deviceToken": "<deviceId>.<48-byte secret>",
  "warning": "Store this token securely on the device. It will not be shown again."
}
```

Errors: `400` invalid/expired code, `409` code already used or 10-device limit reached. The code is bound to the account that created it.

### `GET /devices`

Bearer. Returns a bare array of device objects (oldest link first), each shaped like:

```json
{
  "id": "…",
  "name": "Abdullah's phone",
  "manufacturer": "Samsung",
  "model": "SM-S911B",
  "androidVersion": "14",
  "appVersion": "1.0.0",
  "online": true,
  "lastSeenAt": "…",
  "pairedAt": "…",
  "lostMode": false,
  "lostMessage": "…",
  "contactPhone": "…",
  "locationHistoryEnabled": true,
  "historyRetentionDays": 30,
  "notifyOnReconnect": true,
  "batteryLevel": 72,
  "charging": false,
  "networkConnected": true,
  "networkType": "wifi",
  "lastSyncAt": "…",
  "location": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "accuracyMeters": 12,
    "altitudeMeters": 610,
    "speedMps": null,
    "headingDegrees": null,
    "source": "fused",
    "isMock": false,
    "capturedAt": "…",
    "recordedAt": "…"
  },
  "locationAgeSeconds": 42,
  "locationStale": false,
  "locationLive": true,
  "createdAt": "…"
}
```

`online` = seen within **150 seconds**. `locationStale` = older than **5 minutes**.

### `GET /devices/:id`

Bearer. Same object. `404` if the device is not yours or was unlinked.

### `PATCH /devices/:id`

Bearer. All fields optional:

```json
{
  "name": "Backup phone",
  "lostMessage": "Please call me",
  "contactPhone": "+9665…",
  "locationHistoryEnabled": true,
  "historyRetentionDays": 30,
  "notifyOnReconnect": true
}
```

`historyRetentionDays` is 1–90. Returns the updated device.

### `DELETE /devices/:id`

Bearer. Unlinks the device, deletes its location/status/history/commands and revokes its token. Returns `{ "ok": true }`.

### `GET /devices/:id/location`

```json
{
  "location": { "latitude": 24.71, "longitude": 46.67, "accuracyMeters": 12, "capturedAt": "…", "…": "…" },
  "ageSeconds": 42,
  "stale": false,
  "live": true
}
```

No location yet: `{ "location": null, "stale": true, "ageSeconds": null }`.

### `GET /devices/:id/status`

```json
{
  "online": true,
  "lastSeenAt": "…",
  "batteryLevel": 72,
  "charging": false,
  "networkConnected": true,
  "networkType": "wifi",
  "lastLocationAt": "…",
  "lastSyncAt": "…",
  "appVersion": "1.0.0",
  "locationStale": false
}
```

### `GET /devices/:id/history?from=&to=&limit=`

`from`/`to` are ISO dates, `limit` is 1–500 (default 200). Points are **newest first**:

```json
{
  "deviceId": "…",
  "historyEnabled": true,
  "retentionDays": 30,
  "points": [
    { "id": "…", "latitude": 24.71, "longitude": 46.67, "accuracyMeters": 12, "isMock": false, "capturedAt": "…" }
  ]
}
```

### `GET /devices/:id/commands`

Bearer. Last 30 commands:

```json
[{ "id": "…", "type": "RING", "status": "ACKNOWLEDGED", "payload": { "durationSeconds": 180 }, "createdAt": "…", "acknowledgedAt": "…", "expiresAt": "…", "failureReason": null }]
```

---

## Owner: commands

All command endpoints are Bearer-authenticated, verify device ownership, return **`202 Accepted`**, and accept `Idempotency-Key`. They return the created command:

```json
{ "id": "…", "type": "RING", "payload": { … }, "status": "PENDING", "createdAt": "…", "expiresAt": "…" }
```

| Route | Body (all optional) | Defaults | TTL |
| --- | --- | --- | --- |
| `POST /devices/:id/ring` | `durationSeconds` 10–300, `sound` `siren\|alarm\|ringtone`, `vibration`, `flash` | 180 s, `siren`, true, true | 5 min |
| `POST /devices/:id/stop-ring` | – | – | 15 min |
| `POST /devices/:id/locate` | – | high accuracy | 15 min |
| `POST /devices/:id/lost-mode` | `enabled` (required), `message` ≤300, `contactPhone` ≤80 | — | 24 h (on) / 1 h (off) |
| `POST /devices/:id/message` | `message` 1–300 (required), `contactPhone` ≤80 | — | 24 h |
| `POST /devices/:id/vibrate` | `durationSeconds` 1–60 | 10 s | 15 min |
| `POST /devices/:id/flash` | `durationSeconds` 1–120 | 15 s | 15 min |
| `POST /devices/:id/request-status` | – | – | 15 min |

Notes:

- `ring` returns `429` if another ring was created in the last 10 seconds; `locate` returns `429` within 5 seconds.
- `stop-ring` immediately marks pending/delivered rings as `CANCELLED`, then queues `STOP_RING`.
- `lost-mode` **also persists** `lostMode`/`lostMessage`/`contactPhone` on the device, so a phone that reconnects re-applies the overlay. The response is `{ "device": {…}, "command": {…} }`.
- `message` stores the text as the device's recovery message and queues a `MESSAGE` command.
- Command execution happens **only when the phone polls**. Offline commands wait until they expire.

### Delivery and acknowledgements

The phone fetches commands via `GET /device/commands/pending`, executes them, and calls `POST /device/commands/:id/ack`. Owner-visible status then becomes `ACKNOWLEDGED` or `FAILED` (with `failureReason`), and an in-app notification is created.

---

## Owner: notifications

Bearer.

| Route | Result |
| --- | --- |
| `GET /notifications?limit=50` | Array of notifications, newest first, `limit` 1–100, includes `device: { id, name }` or `null` |
| `GET /notifications/unread-count` | `{ "count": 3 }` |
| `POST /notifications/:id/read` | `{ "ok": true }` |
| `POST /notifications/read-all` | `{ "read": 12 }` |

Types: `DEVICE_ONLINE`, `DEVICE_OFFLINE`, `COMMAND_ACK`, `LOCATION_UPDATE`, `LOST_MODE`, `BATTERY_LOW`, `SECURITY`.

Notifications are generated for: new pairing, Lost Mode changes, command acknowledgements/failures, device reconnect (if enabled), low battery (≤15%, not charging, at most one per 6 hours), new location while in Lost Mode, and (when push is configured) push delivery.

---

## Device agent API

All routes require `Authorization: Device <deviceId>.<secret>`.

### `GET /device/me`

```json
{
  "device": { "id": "…", "name": "…", "lostMode": false, "locationHistoryEnabled": true, "…": "…" },
  "serverTime": "…"
}
```

### `POST /device/heartbeat`

```json
{ "batteryLevel": 72, "charging": false, "networkConnected": true, "networkType": "wifi", "appVersion": "1.0.0" }
```

`200`:

```json
{ "ok": true, "serverTime": "…", "online": true, "lostMode": false, "lostMessage": "…", "contactPhone": "…", "locationHistoryEnabled": true }
```

The device is considered online for 150 seconds after a heartbeat.

### `POST /device/location`

```json
{
  "latitude": 24.7136,
  "longitude": 46.6753,
  "accuracyMeters": 12,
  "altitudeMeters": 610,
  "speedMps": 0,
  "headingDegrees": 0,
  "capturedAt": "2026-10-27T12:00:00.000Z",
  "isMock": false,
  "source": "fused"
}
```

`201`:

```json
{ "ok": true, "accepted": true, "capturedAt": "…", "historySaved": true }
```

`accepted` is false when the point is older than the stored one. Timestamps more than 2 minutes in the future are rejected with `400`. History is written only when the owner enabled consent for that device.

### `GET /device/commands/pending`

Marks expired commands as `EXPIRED`, returns up to 10 executable commands ordered oldest first, marks them `DELIVERED`, and also returns the current Lost Mode state:

```json
{
  "commands": [{ "id": "…", "type": "RING", "payload": { … }, "status": "DELIVERED", "createdAt": "…", "expiresAt": "…" }],
  "serverTime": "…",
  "lostMode": { "lostMode": true, "lostMessage": "…", "contactPhone": "…" }
}
```

A command already marked `DELIVERED` is only returned again after 25 seconds, which gives at-least-once delivery without an immediate duplicate storm.

### `POST /device/commands/:id/ack`

```json
{ "status": "SUCCESS", "message": "optional detail" }
```

`status` is `SUCCESS` or `FAILED` (≤500 chars message). Returns `{ "ok": true }`. Unknown command IDs return `404`.

### `POST /device/push-token`

```json
{ "token": "<FCM registration token>" }
```

`{ "ok": true }`.

---

## Health

### `GET /`

```json
{ "name": "Abdullah Laqeeni API", "version": "1.0.0", "status": "online", "documentation": "/health" }
```

### `GET /health`

`200`:

```json
{ "status": "ok", "database": "ok", "push": "polling-only", "time": "2026-10-27T12:00:00.000Z" }
```

`push` is `fcm` when a Firebase service account is configured. Database failure: `503` `{ "status": "degraded", "database": "unreachable" }`.

---

## Errors

Standard NestJS shape:

```json
{ "statusCode": 400, "message": "Pairing code is invalid", "error": "Bad Request" }
```

Validation errors use an array:

```json
{ "statusCode": 400, "message": ["password must be longer than or equal to 10 characters"], "error": "Bad Request" }
```

| Status | Meaning in this API |
| --- | --- |
| `400` | Validation failure, invalid/expired pairing code, wrong 2FA code, future location timestamp |
| `401` | Missing/invalid bearer or device token, revoked session, bad password |
| `403` | Not used; ownership failures are reported as `404` to avoid leaking IDs |
| `404` | Device/command/session not found **or not owned by you** |
| `409` | Pairing code already used, 10-device limit, 2FA already enabled |
| `429` | Rate limit or duplicate ring/locate guard |
| `500` | Unexpected server error |
| `503` | Health check database failure; pairing code allocation failure |

---

## Command lifecycle

```
PENDING ──poll──▶ DELIVERED ──ack SUCCESS──▶ ACKNOWLEDGED
   │                  │
   │                  └──ack FAILED───────▶ FAILED
   ├──expiresAt passed──▶ EXPIRED  (set when the device next polls)
   └──stop-ring────────▶ CANCELLED (for queued rings)
```

- `expiresAt` is enforced on the device read path, so an offline phone can never execute an old command later.
- `DEPRECATED` is not a status; terminal states are `ACKNOWLEDGED`, `FAILED`, `EXPIRED`, `CANCELLED`.
- Retries are safe because the phone acknowledges by command ID and the owner UI can request a new command.
- Push messages contain only `{ type: "COMMAND", commandId, deviceId, commandType }`; the payload is fetched over authenticated HTTP.
