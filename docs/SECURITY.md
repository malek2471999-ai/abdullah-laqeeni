# Security & privacy

This document describes what the system protects, how, what it deliberately does **not** do, and what still needs attention before production.

- [Scope and threat model](#scope-and-threat-model)
- [Accounts and sessions](#accounts-and-sessions)
- [Pairing and device identity](#pairing-and-device-identity)
- [Data protection](#data-protection)
- [Commands and replay protection](#commands-and-replay-protection)
- [Web dashboard security](#web-dashboard-security)
- [Android security](#android-security)
- [Privacy and consent](#privacy-and-consent)
- [Abuse resistance](#abuse-resistance)
- [Platform limits (explicit non-goals)](#platform-limits-explicit-non-goals)
- [Dependency audit](#dependency-audit)
- [Deployment checklist](#deployment-checklist)
- [Responsible disclosure](#responsible-disclosure)

---

## Scope and threat model

**Assets**

1. Location of a protected phone (live and history).
2. Ability to trigger an alarm/torch on that phone.
3. Account credentials, sessions and the device links themselves.
4. Audit trail of who did what.

**Assumed adversaries**

| Adversary | Capability | Mitigation |
| --- | --- | --- |
| Network attacker | Read/modify traffic between app/dashboard and API | TLS in production; release Android build forbids cleartext; tokens in headers, not URLs |
| Credential stuffer | Try leaked passwords | bcrypt cost 12, strict policy, 10 login/min/IP, 2FA, security events |
| Someone who finds the phone | Physical access, screen locked | Lost Mode overlay + alarm; **not** a full device lock (no Device Admin) |
| Malicious account holder | Tries to access another user's devices | Every owner route enforces `userId` ownership; foreign IDs return `404` |
| Replay attacker | Re-sends a captured command | Idempotency keys, expiries, per-device scoping, acknowledgements, duplicate guards |
| Database thief | Reads the DB/backups | Coordinates/2FA secrets AES-256-GCM; tokens are HMAC hashes; passwords bcrypt |
| Rogue app on the phone | Reads app storage | Android Keystore-backed encrypted preferences, `allowBackup=false` |
| Spoofed push | Crafted FCM message | Push carries only IDs/metadata; commands are always fetched over authenticated HTTPS |

**Out of scope:** a rooted/compromised phone, a determined attacker who can uninstall the app, Google/OS-level compromise, compromised hosting credentials, and lawful interception. No software can guarantee recovery of a powered-off or factory-reset phone.

---

## Accounts and sessions

| Control | Implementation |
| --- | --- |
| Password hashing | bcrypt, cost **12** (`bcryptjs`) |
| Password policy | 10–128 chars, at least one upper, lower and digit; e-mail normalised to lowercase |
| Access token | JWT HS256, `sub`, `email`, `sid`, `type: access`, default TTL **15 min** (`ACCESS_TOKEN_TTL`) |
| Refresh token | `<sessionId>.<48 random bytes base64url>`; only HMAC-SHA256 stored; default lifetime **30 days** |
| Rotation | Every refresh issues a new secret and replaces the stored hash |
| Reuse detection | A refresh token that fails validation for an existing, un-revoked session revokes that session |
| Revocation | Per-session revoke, logout-all (keeps current), password change revokes other sessions, account deletion cascades |
| 2FA | TOTP (30 s, 6 digits) via `otplib`; secret stored AES-256-GCM encrypted; enable requires a valid code; disable requires password **and** code |
| 2FA challenge | Signed JWT with `purpose: 2fa`, 5-minute TTL, cannot be used as an access token |
| E-mail tokens | 32 random bytes, HMAC stored, 30-minute expiry, single use, deleted after 7 days past expiry |
| Enumeration | Login always says "Invalid e-mail or password"; forgot-password always returns `ok` |
| Audit | `SecurityEvent` for login success/failure, register, password reset/change, logout-all, pairing/unpairing, commands, 2FA changes; retained 180 days |

**Known trade-off:** access tokens are not individually revoked on logout; they remain valid until they expire (≤15 min). The refresh session is revoked immediately. This keeps the API stateless. Reduce `ACCESS_TOKEN_TTL` if that window is unacceptable.

---

## Pairing and device identity

- Pairing codes are **8 characters** from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 symbols, no `I/O/0/1`), generated with `crypto.randomInt` → ~40 bits of entropy.
- Codes live for **10 minutes**, are **single use**, are bound to the creating account, and are stored only as `HMAC-SHA256("pairing:" + code)` keyed by `TOKEN_PEPPER`.
- Creating a new code cancels any pending code for that account.
- The pairing endpoint requires an authenticated owner **and** a code belonging to that owner, so a leaked code alone is useless without the account.
- Each account can link at most **10** active devices.
- On success the API returns a device token `<deviceId>.<48 random bytes>` exactly once. The database stores only an HMAC and a 4-character display suffix.
- Device tokens are checked in constant time and can be invalidated by unlinking the device (`revokedAt`).
- Device routes are scoped to the token's own device; path IDs are never trusted alone.

Residual risk: a pairing code observed on screen can be used by someone who also has the account credentials. The 10-minute window and single use limit that; pairing also produces an in-app security notification.

---

## Data protection

### At rest

| Data | Protection |
| --- | --- |
| Coordinates (current + history) | AES-256-GCM, random 12-byte IV per record, versioned format `v1.<iv>.<tag>.<ciphertext>` (base64url) |
| 2FA secret | Same AES-256-GCM envelope |
| Password | bcrypt |
| Refresh tokens, device tokens, pairing codes, e-mail tokens | HMAC-SHA256 with `TOKEN_PEPPER` (never reversible) |
| Command payloads | Stored as JSON; contain messages/contact numbers, not coordinates |

`LOCATION_ENCRYPTION_KEY` derives the AES-256 key (32 bytes, base64 or hex). In development a key is derived from `JWT_ACCESS_SECRET` with a warning; in production the API **refuses to start** without a valid 32-byte key. Losing or rotating the key makes stored coordinates unreadable — back it up separately from the database.

GCM authentication means tampered ciphertext fails closed; decryption errors are logged and the API returns "no location" instead of leaking garbage.

### In transit

- Production expects HTTPS (reverse proxy or managed platform).
- The **release** Android build sets `usesCleartextTraffic=false` and `ALLOW_INSECURE_SERVER=false`.
- Debug builds allow cleartext and user CAs so you can test `http://192.168.x.x:4000/` on a LAN.
- Helmet sets standard security headers; CORS is an explicit allow-list with no credentials.
- JSON bodies are capped at 128 kB; validation whitelists properties.

### Retention

| Data | Retention |
| --- | --- |
| Location history | Per device, 1–90 days (default 30), purged hourly |
| Notifications | Read notifications after 90 days |
| Security events | 180 days |
| Sessions | Deleted 7 days after expiry |
| E-mail tokens | Deleted 7 days after expiry |
| Commands | Kept with the device; deleted when the device is unlinked |
| Account | Deleted on request: devices, pairings, notifications, e-mail tokens and security events removed; sessions revoked; the user row is anonymised and marked deleted |

---

## Commands and replay protection

1. **Ownership** is checked before any command is created.
2. **Idempotency**: `Idempotency-Key` is combined with the command type and stored under a unique `(deviceId, idempotencyKey)` constraint. A retry returns the original command.
3. **Duplicate guards**: ring is rejected within 10 s, locate within 5 s, while a similar command is still active.
4. **Expiry**: every command has `expiresAt`. The device read path marks and skips expired commands, so a phone that reconnects days later will not suddenly scream in someone's drawer.
5. **Delivery is at-least-once, execution is at-most-once**: the phone records processed command IDs in Room and acknowledges duplicates without re-running them. A re-delivered command after 25 s is acknowledged as "already processed".
6. **Acknowledgements** update the owner-visible status and produce a notification; failures carry a reason.
7. **Cancel semantics**: `stop-ring` cancels queued rings server-side and queues `STOP_RING` for the device.
8. **Push cannot execute**: FCM data messages only wake the app; the command payload is fetched with the device token.

Residual risk: because delivery is at-least-once, an alarm may restart if the app crashes after starting it but before the acknowledgement is stored. The Room processed-ID table makes this unlikely; the on-device stop button and the auto-stop timer bound the impact.

---

## Web dashboard security

- Authentication is handled in **server-side route handlers** (`/api/session/*`). Tokens are written to `httpOnly`, `SameSite=Lax` cookies (`secure` in production). No token is exposed to browser JavaScript or `localStorage`.
- All API calls go through `/api/proxy/[...path]`; the server attaches the bearer token. Path traversal segments (`..`, empty) are rejected.
- The proxy refreshes the session once on `401`, re-issues cookies, and clears them when refresh fails.
- Server-rendered pages call the API with the cookie token; unauthenticated users are redirected to `/login`.
- `Cache-Control: no-store` on proxied responses. Server actions use POST-only handlers.
- Cross-site request forgery is limited by `SameSite=Lax` plus JSON-only endpoints (no form posts, no `text/plain`).
- No third-party analytics, fonts or scripts are loaded.
- Dependency audit is clean (`npm audit --omit=dev` → 0).

**CSRF caveat:** if you change `SameSite` to `None` (e.g. dashboard and API on unrelated sites), add an explicit CSRF token. The current deployment model (same site via reverse proxy) does not need it.

---

## Android security

| Control | Implementation |
| --- | --- |
| Token storage | `EncryptedSharedPreferences` with an AES-256-GCM Keystore master key; falls back to private preferences only if the Keystore is unavailable |
| Backups | `allowBackup=false`, `dataExtractionRules` excludes sensitive data |
| Components | `MainActivity` is the only exported activity. The boot receiver is exported because it handles protected system broadcasts (`BOOT_COMPLETED`, `MY_PACKAGE_REPLACED`); all other services/receivers are internal. The deep link accepts only `laqeeni://pair`. |
| Network | Debug: cleartext allowed for LAN; Release: cleartext forbidden, system CAs only |
| Logging | OkHttp logging is debug-only and redacts `Authorization` |
| Permissions | Only what the features need: internet, network state, location, notifications, foreground service, boot, vibrate, camera (torch/QR), wake lock, full-screen intent |
| Not requested | SMS, contacts, microphone, `SYSTEM_ALERT_WINDOW`, Accessibility, Device Admin, `QUERY_ALL_PACKAGES`, background camera |
| Camera | Used for QR scanning and torch only; no image capture, no preview recording |
| Microphone | Never accessed |
| Lost Mode | Full-screen activity with `showWhenLocked`/`turnScreenOn` — not a device lock |
| Alarm | `USAGE_ALARM` stream, wake lock, auto-stop; never modifies DND or silent settings |

**Screen-over-lock-screen** uses activity flags, not the overlay permission. Android still lets the user press Home/Back or power off; a thief can escape it. That is why the project does not call Lost Mode a "lock".

**Android 14+ full-screen intents:** `USE_FULL_SCREEN_INTENT` is restricted by policy; on some devices the user must allow full-screen notifications for the alarm UI to appear over the lock screen. The alarm service still runs and rings if the notification is downgraded to a heads-up notification.

---

## Privacy and consent

- **Location history is off by default** (`locationHistoryEnabled = false`). Current location is still uploaded so the owner can find the phone; enabling history additionally stores points.
- The app explains the consent before it is enabled and lets the owner disable it at any time. Disabling stops new points; existing points remain until retention or deletion.
- Retention is per device (1–90 days) and enforced hourly by a scheduled cleanup.
- Unlinking a device deletes its stored location, status, history, commands, acknowledgements and notifications (database cascades).
- Account deletion removes the user's devices, location data, notifications, e-mail tokens and security events, revokes sessions, and replaces the account identity with `deleted+<id>@laqeeni.invalid` so it can never authenticate again. The anonymised tombstone row keeps referential integrity for any remaining audit/notification rows.
- No advertising SDKs, no analytics, no third-party trackers. Map tiles are the only third-party request (OpenStreetMap by default) and reveal the viewed area to the tile server.
- The dashboard shows device data only to the account that owns it.

**Legal:** only use this on devices you own or are authorised to manage, and inform other users of a shared device. Covert tracking of another person is illegal in many jurisdictions and is not a supported use.

---

## Abuse resistance

| Vector | Control |
| --- | --- |
| Brute force | bcrypt + 10 login/min/IP + 2FA + security events |
| Registration spam | 5/min/IP + e-mail verification support |
| Password reset abuse | Uniform responses, 5/min/IP, 30-minute single-use tokens |
| Pairing code guessing | 40-bit code, 10-minute window, bound to account, 8 attempts per creation loop, rate-limited globally |
| Command flooding | 120 req/min global, ring/locate duplicate guards, per-device idempotency |
| Enumeration | Foreign devices/commands return `404` |
| Token theft (DB) | Only HMACs stored |
| Token theft (phone) | Keystore encryption, no backups, remote unlink revokes |
| Database DoS via body size | 128 kB JSON limit |
| Log leakage | Secrets are not logged; dev tokens only when `EXPOSE_DEV_TOKENS=true` |

Rate limiting is in-memory per process. With multiple API replicas, per-IP limits apply per replica; put a shared limiter (Redis) or an edge rate limit in front for strict global limits.

---

## Platform limits (explicit non-goals)

The project refuses to implement or pretend to implement:

1. **Remote device lock / factory reset / wipe.** Requires Device Admin or Device Owner. Not used.
2. **Bypassing Do Not Disturb, silent mode, or volume locks.** The alarm uses the alarm stream and respects the user's sound policy.
3. **Hidden camera or microphone capture.** Not implemented, not permitted by the UI copy.
4. **Accessibility-service automation** to click through other apps or settings.
5. **Surviving uninstall or factory reset.** Not possible for a normal app.
6. **Executing commands without connectivity.** Commands queue and expire.
7. **Reading SMS or call logs.**
8. **Silent installation of updates.** Sideloaded APK updates need user confirmation.
9. **Guaranteed background execution.** OEM battery managers can stop any app; the UI tells the user to disable restrictions.

If you need enterprise-grade lock/wipe, use Android Enterprise (Device Owner) with a managed device and a proper EMM — that is a different product and a different consent model.

---

## Dependency audit

Verified **2026-10-27**:

- `web/`: `npm audit --omit=dev` → **0 vulnerabilities**.
- `backend/`: `npm audit --omit=dev` → **13 vulnerabilities (8 moderate, 5 high)**.

Direct packages flagged: `@nestjs/common`, `@nestjs/config`, `@nestjs/core`, `@nestjs/platform-express` (high), `@nestjs/schedule`, `nodemailer` (high). Transitive: `body-parser`, `file-type`, `gaxios`, `lodash`, `multer`, `qs`, `uuid`.

Every recommended fix is a **semver-major** jump: NestJS 12, `nodemailer` 10, `@nestjs/schedule` 12, which also drags in new transitive versions. A plain `npm audit fix` was tested during verification and **increased** the advisory count (newer transitive versions carry their own 2026 advisories), so it was reverted. Chasing versions blindly would be worse than a documented, tested upgrade.

**Exposure assessment for the current stack:**

- The high-severity `multer`/`body-parser` items concern multipart parsing and crafted request bodies. The API **accepts no file uploads** and caps JSON at 128 kB with a strict validation pipe; the practical attack surface is small, but a crafted `application/json` body is still parsed by `body-parser` upstream.
- `nodemailer` advisories concern address parsing and DNS/TLS behaviour when sending attacker-controlled addresses. This project sends only to account e-mails stored at registration; SMTP is optional. The credential-disclosure advisory requires an attacker-controlled SMTP transport configuration, which is operator-controlled.
- `qs` is reached through Express query parsing; `history` query parameters are validated by DTOs. DoS via pathological query strings remains theoretically possible.
- `uuid` is transitive through `gaxios` (Google auth) and scheduling; the advisory affects v3/v5/v6 with a caller-provided buffer, which this project does not use.

**Upgrade plan (recommended before a public launch):**

1. Branch and upgrade NestJS to 12 (`@nestjs/common`, `core`, `platform-express`, `config`, `schedule`), fixing breaking API changes and re-running `npm test`, `npm run test:e2e`, `npm run build`.
2. Upgrade `nodemailer` to 10 and verify mail transport with a real SMTP sandbox.
3. Re-run `npm audit --omit=dev`; if advisories remain in transitive packages, add narrowly scoped `overrides` and re-test.
4. Keep the API behind a WAF/CDN with request-size and rate limits as defence in depth.
5. Re-audit before every release; do not treat this snapshot as permanent.

Until then, do not expose the API to untrusted networks without a reverse proxy that enforces body-size and rate limits.

---

## Deployment checklist

- [ ] `NODE_ENV=production`, `EXPOSE_DEV_TOKENS=false`.
- [ ] Four secrets ≥32 chars/32 bytes, unique, stored in a secret manager; `LOCATION_ENCRYPTION_KEY` backed up separately.
- [ ] TLS termination; HSTS at the proxy; HTTP redirected to HTTPS.
- [ ] `CORS_ORIGINS` exact origins, no wildcards.
- [ ] PostgreSQL not publicly reachable; least-privilege DB user; encrypted disk; tested backups.
- [ ] `prisma migrate deploy` with committed migrations (not `db push`).
- [ ] No demo seed; confirm `demo@laqeeni.app` cannot authenticate.
- [ ] SMTP configured and SPF/DKIM/DMARC set for the sending domain.
- [ ] Firebase service account restricted and rotated.
- [ ] `/health` monitored; alert on 503.
- [ ] Logs aggregated, no PII/secrets, retention defined.
- [ ] Edge rate limits and body-size limits in addition to the app's.
- [ ] Dependency upgrades scheduled; `npm audit` reviewed each release.
- [ ] Incident response: rotate `TOKEN_PEPPER` (invalidates all device/pairing/e-mail tokens), rotate JWT secrets (logs everyone out), rotate the encryption key only with a re-encryption plan.

---

## Responsible disclosure

This is a private project. If you find a vulnerability, contact the project owner privately with reproduction steps and affected versions. Do not open a public issue containing exploit details, personal data, tokens or location samples.
