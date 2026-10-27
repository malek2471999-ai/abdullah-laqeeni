# Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡ Ù„Ø§Ù‚ÙŠÙ†ÙŠ Â· Abdullah Laqeeni

> **Ø¶Ø§Ø¹ Ù‡Ø§ØªÙÙƒØŸ Ø¹Ø¨Ø¯Ø§Ù„Ù„Ù‡ Ù„Ø§Ù‚ÙŠÙ†ÙŠ!**
> *Lost your phone? Abdullah Laqeeni!*

## ▶ [افتح البرنامج مباشرة · Open the live app](https://abdullah-laqeeni-web.onrender.com)

| | |
| --- | --- |
| **Live dashboard (production)** | <https://abdullah-laqeeni-web.onrender.com> |
| **GitHub entry point (always stable)** | <https://malek2471999-ai.github.io/abdullah-laqeeni-live/> |
| **Your real account** | `malek2471999@gmail.com` / `Lqeeni!R3al#User` (غيّرها من Security الآن) |
| **Android APK** | [Releases → v1.0.0](https://github.com/malek2471999-ai/abdullah-laqeeni/releases/tag/v1.0.0) |

> ✅ **Program now on permanent hosting**: Render (API + Web) + Neon (PostgreSQL). GitHub Pages entry forwards to it.
>
> Free-tier limits apply (Render س750 hours/month for 1 always-on service). Vercel not used.

A complete, self-hosted phone-recovery system: an Android app for the phone you want to protect, a NestJS + PostgreSQL backend, and a Next.js dashboard that works from any browser. Link your own phones in advance, then locate, ring, flash, message and put a lost phone into Lost Mode when it goes missing.

This repository is a working monorepo, not a design mock-up. Every screen and button is wired to a real API endpoint and a real database, except where a platform restriction is called out explicitly (see [Known limitations](#known-limitations)).

---

## Verification status

Last verified on **2026-10-27** on Windows 11, Node 24.19.0, JDK 17, Android SDK 35.

| Area | Result | Evidence |
| --- | --- | --- |
| Backend compiles | âœ… Pass | `npm run build` â†’ `dist/main.js` |
| Backend unit tests | âœ… 8/8 | `npm test` (`test/crypto.service.spec.ts`) |
| Backend HTTP smoke tests | âœ… 4/4 | `npm run test:e2e` (in-memory Prisma stub) |
| Prisma schema | âœ… Valid | `prisma validate` (with `DATABASE_URL` set) |
| Web i18n parity | âœ… 348 keys Ã— EN/AR/FR | `npm run check:i18n` |
| Web type check | âœ… Pass | `tsc --noEmit` |
| Web production build | âœ… Pass, 28 routes | `npm run build` (Next.js 16.4.3) |
| Web dependency audit | âœ… 0 vulnerabilities | `npm audit --omit=dev` |
| Android debug APK | âœ… Builds | `:app:assembleDebug`, 67,155,446 bytes |
| Android release APK | âœ… Builds with R8, **unsigned** | `:app:assembleRelease`, 47,461,328 bytes |
| APK SHA-256 (debug) | `D9000D7A459BBF27B1092CAA973651E147D06F38DD0554EC6FED64F3950BF2E6` | `Get-FileHash` |
| Live DB + API + web | âœ… Pass | PostgreSQL 16.15 + seed + `GET /health` (`database: ok`) + dashboard renders seeded device and alerts |
| Live command round-trip | âœ… Pass | Ring â†’ `PENDING` â†’ device poll â†’ `DELIVERED` â†’ device ack â†’ `ACKNOWLEDGED` |
| Two-phone runtime | â³ Not run here | No physical Android device in the build environment |

The APK was **compiled and packaged**, not installed on a physical phone in this environment. The API, PostgreSQL database and web dashboard were run end-to-end locally, including an ownerâ†’deviceâ†’owner command round-trip. The live `prisma db push` also caught a real schema bug (`PairingRequest.deviceId` missing `@db.Uuid`, incompatible with `Device.id`), now fixed. See [docs/TESTING.md](docs/TESTING.md) for the exact commands, the manual two-phone test script, and what still needs a real device.

---

## What you get

### On the protected phone (the one that might get lost)

- Email/password account, optional TOTP two-factor authentication.
- Link the phone with an 8-character pairing code or a QR code (`laqeeni://pair?code=â€¦`).
- Foreground protection service with a 20-second authenticated command poll (optional FCM push wakes it instantly when configured).
- 15-minute WorkManager fallback, plus restart after reboot.
- Fused location uploads (foreground, and background when you grant it).
- Battery level, charging state, network type and last-sync timestamps.
- **Ultra Find**: loud siren/alarm/ringtone on the alarm stream, vibration, torch flashing, full-screen alarm UI, auto-stop timer.
- **Lost Mode**: full-screen recovery message over the lock screen, owner contact, message and status while the phone is lost.
- Consent-based location history with a configurable retention window (1â€“90 days).
- Arabic (RTL), English and French UI; dark/light/system themes; phone and tablet layouts.
- Encrypted token storage via Android Keystore (`EncryptedSharedPreferences`).
- No hidden camera, no microphone capture, no Accessibility abuse, no Device Admin.

### On the owner's phone or the web dashboard

- Sign in, see all linked devices with online/offline, battery and last-known location.
- Live MapLibre map with accuracy circle and a "stale location" warning. No map API key required (OpenStreetMap raster tiles by default).
- Request a fresh fix, ring/stop, vibrate, flash, send a message, toggle Lost Mode.
- Command log with delivery state, acknowledgements and failures.
- Location history map + list.
- Notifications (device online, low battery, command acknowledged).
- Account security: active sessions, revoke one/all, change password, 2FA setup/disable, security event log, account deletion.
- Per-device settings: name, recovery message, contact phone, history consent, retention, reconnect alerts, unlink.
- Trilingual dashboard (EN/AR/FR) with RTL support, light/dark theme, responsive layout.

---

## Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        HTTPS / JSON        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Android app (Kotlin)    â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶  â”‚  NestJS API              â”‚
â”‚  Compose Â· Hilt Â· Room   â”‚   Bearer / Device token    â”‚  Prisma Â· PostgreSQL     â”‚
â”‚  FusedLocation Â· FCM     â”‚  â—€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚  JWT Â· 2FA Â· audit log   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   long-poll every 20 s    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                                     â”‚ internal HTTP
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        HTTPS + cookies                 â”‚
â”‚  Next.js dashboard       â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚  RSC Â· Tailwind Â· MapLibreâ”‚  server-side proxy, httpOnly tokens
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Pairing.** The owner signs in on the phone to protect and taps *Create a pairing code*. The backend stores only an HMAC of the code, valid for 10 minutes. That phone (same account, or a second phone signed into the same account) enters the code; the backend issues a device-scoped token of the form `<deviceId>.<secret>` and stores only its HMAC. From then on, the phone authenticates with `Authorization: Device <token>` and the owner authenticates with `Authorization: Bearer <jwt>`.

**Commands.** Owner actions create a `RemoteCommand` row with a type, JSON payload, expiry (usually 15 minutes; ring 5 minutes; Lost Mode 24 hours) and a per-device idempotency key. The protected phone polls `/device/commands/pending`, executes, and acknowledges. If the phone is offline, the command waits until it expires â€” it is **never** executed while there is no connectivity. Ring has a 10-second duplicate guard; Lost Mode is persisted on the device record so a reconnect re-applies it.

**Data.** Location coordinates are encrypted with AES-256-GCM before they touch the database. History points are only written when the owner enabled consent for that device. Deleting a device deletes its points; deleting an account removes its devices, history, notifications, tokens and security events, then anonymises the account row (`deleted+<id>@laqeeni.invalid`) so it can never sign in again.

---

## Repository layout

```
abdullah-laqeeni/
â”œâ”€â”€ android/                 Kotlin + Compose app (Gradle 8.14.3, AGP 8.7.3)
â”‚   â”œâ”€â”€ app/src/main/java/com/abdullah/laqeeni/
â”‚   â”‚   â”œâ”€â”€ core/            auth, network, data, location, commands, alarm, push
â”‚   â”‚   â”œâ”€â”€ di/              Hilt modules
â”‚   â”‚   â””â”€â”€ ui/              theme, screens, viewmodels, navigation
â”‚   â””â”€â”€ app/src/{debug,release}/res/xml/network_security_config.xml
â”œâ”€â”€ backend/                 NestJS 10 + Prisma 5 + PostgreSQL
â”‚   â”œâ”€â”€ prisma/schema.prisma data model
â”‚   â”œâ”€â”€ prisma/seed.ts       idempotent demo data
â”‚   â”œâ”€â”€ src/auth/            accounts, sessions, 2FA, password reset, e-mail
â”‚   â”œâ”€â”€ src/devices/         pairing, commands, owner + device APIs
â”‚   â”œâ”€â”€ src/notifications/   in-app notification feed
â”‚   â””â”€â”€ test/                Jest unit + HTTP smoke tests
â”œâ”€â”€ web/                     Next.js 16 dashboard (App Router)
â”‚   â”œâ”€â”€ app/api/session/     login/register/2FA/logout cookie handlers
â”‚   â”œâ”€â”€ app/api/proxy/       authenticated proxy to the API
â”‚   â”œâ”€â”€ app/(app)/           dashboard, devices, map, history, security, settings
â”‚   â””â”€â”€ scripts/check-i18n.mjs
â”œâ”€â”€ docs/                    setup, API, security, testing
â”œâ”€â”€ docker-compose.yml       PostgreSQL + API + dashboard
â”œâ”€â”€ check-strings.cjs        Android string-key audit (EN/AR/FR)
â””â”€â”€ README.md
```

---

## Quick start

Prerequisites: Node.js 20+, Docker (or a local PostgreSQL 16), JDK 17, Android SDK 35. Full details in [docs/SETUP.md](docs/SETUP.md).

```powershell
# 1. Database + API
cd abdullah-laqeeni
docker compose up -d db

cd backend
Copy-Item .env.example .env      # then replace the four secrets (see SETUP.md)
npm install
npx prisma db push
npm run seed                     # demo owner + demo device (development only)
npm run start:dev                # http://localhost:4000

# 2. Dashboard (second terminal)
cd ..\web
Copy-Item .env.example .env.local
npm install
npm run dev                      # http://localhost:3000

# 3. Android (third terminal)
cd ..\android
.\gradlew.bat :app:assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Demo credentials created by the seed:

| What | Value |
| --- | --- |
| Web / app login | `demo@laqeeni.app` / `Laqeeni#2026` |
| Pairing code (10 min) | `DEMO-2026` (or `DEMO2026`) |
| Demo device API token | `11111111-1111-4111-8111-111111111111.demo-device-secret-do-not-use-in-production-0001` |

> The demo device exists so you can exercise the API without a second phone. Do not seed production.

---

## First real test with two phones

You need two Android phones (or one phone + the web dashboard) and one computer running the backend on the same Wi-Fi.

> The backend, database and dashboard have already been exercised together locally, including a full command round-trip (owner â†’ device poll â†’ ack). Only the phone-side steps below still need real hardware.

1. Start PostgreSQL, the backend and the dashboard on the computer.
2. Find the computer's LAN address: `ipconfig` â†’ IPv4, e.g. `192.168.1.20`. Allow inbound TCP 4000 in the firewall.
3. Build and install the **debug** APK on both phones. Debug builds allow `http://192.168.1.20:4000/`; release builds require HTTPS.
4. On both phones: *Settings â†’ Server address* â†’ `http://192.168.1.20:4000/` â†’ save.
5. Phone **A** (the one you will "lose"): register or sign in, then *Link this phone*. Leave the pairing code on screen.
6. Phone **B** (the rescuer): sign in with the **same account** â†’ *Devices* â†’ *Link a device* â†’ *Another phone* â†’ enter the code from phone A, or scan its QR.
7. On phone A, grant location and notification permissions and start the protection service.
8. On phone B, open the device: request a fresh location, then **Start loud alarm**. Phone A should ring/flash within ~20 seconds (instantly if FCM is configured).
9. Put phone A in Lost Mode from phone B; lock phone A's screen and confirm the recovery overlay appears.
10. Turn off Wi-Fi/mobile data on phone A. Send a command: it stays queued and is **not** executed. Reconnect, wait â‰¤20 s, and it runs.

Expected timing: commands are delivered on the next poll (20 s idle, 45 s after an error). Location freshness is marked stale after 5 minutes; online means seen within 2.5 minutes.

---

## Configuration essentials

Backend (`backend/.env`):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOKEN_PEPPER` | yes in prod | â‰¥32 chars each; the API refuses to boot in production otherwise |
| `LOCATION_ENCRYPTION_KEY` | yes in prod | 32 bytes, base64 or hex |
| `CORS_ORIGINS` | yes | Comma-separated dashboard origins |
| `GOOGLE_CLIENT_ID` | optional | Enables Google ID-token sign-in |
| `SMTP_*`, `MAIL_FROM` | optional | Verification/reset e-mails; without SMTP links are logged |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | optional | Single-line service-account JSON; without it the app polls only |
| `EXPOSE_DEV_TOKENS` | dev only | Returns verification/reset tokens in API responses; never in production |

Web (`web/.env.local`): `API_INTERNAL_URL` (server â†’ API), `NEXT_PUBLIC_API_URL` (documentation links), `NEXT_PUBLIC_SITE_URL` (canonical URL baked into `sitemap.xml` at build time), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (optional).

Android: server URL is editable in *Settings*; release builds default to `https://api.laqeeni.app/` and forbid cleartext. Add `android/app/google-services.json` to enable Firebase Cloud Messaging (the Gradle plugin is applied only when the file exists).

---

## Security in one page

- bcrypt (cost 12) password hashes; 10â€“128 character policy with upper/lower/digit.
- Short-lived access JWT (15 min) + rotating refresh tokens stored as HMAC hashes, per-session revocation.
- TOTP 2FA with a signed challenge token between password and code steps.
- Pairing codes: 8 characters from a 32-symbol unambiguous alphabet, 10-minute expiry, single use.
- Device tokens: 48 random bytes, HMAC-SHA256 at rest, compared in constant time, revocable.
- AES-256-GCM for coordinates and command payload encryption primitives; authenticated decryption fails closed.
- Strict DTO validation (`whitelist`, `forbidNonWhitelisted`), 128 kB JSON body limit, Helmet headers, CORS allow-list.
- Global rate limit 120 req/min + tighter auth limits (5 register, 10 login, 10 2FA, 30 refresh per minute).
- Ownership check on every owner endpoint; device endpoints scoped to the token's device; audit events for auth, pairing, commands and deletion.
- Command idempotency keys, duplicate guards, expiries, delivery retries and acknowledgements prevent replayed/double execution.
- Web keeps tokens in `httpOnly`, `SameSite=Lax` cookies; the browser never sees a bearer token. Server-side proxy refreshes once on 401.
- Android stores tokens in Keystore-backed encrypted preferences; debug logging redacts `Authorization`.

Full threat model and deployment checklist: [docs/SECURITY.md](docs/SECURITY.md).

---

## Known limitations

These are real platform/design limits, documented instead of faked:

1. **No connectivity, no action.** Commands are queued, not executed. The app never claims otherwise.
2. **Lost Mode cannot lock the phone.** True device lock requires Device Admin/Device Owner, which this project deliberately avoids. Lost Mode shows a full-screen activity over the lock screen, a persistent notification and a recovery message. A determined thief can dismiss it or uninstall the app (unless the device is managed).
3. **Do Not Disturb and volume limits are respected.** Android does not allow a normal app to bypass DND or silent mode. Alarm volume depends on the alarm stream and the phone's settings.
4. **Torch and camera depend on hardware.** Flash commands fail gracefully when there is no usable flash; the camera is used only for the torch and QR scanning â€” never to capture images.
5. **OEM battery optimisation can kill the service.** On Xiaomi/Huawei/Oppo/Samsung, users should disable battery restrictions for the app. The 15-minute WorkManager job and FCM are fallbacks, not guarantees.
6. **Background location must be granted explicitly**; without it, the protection service runs as a data-sync service and location updates stop when the app is backgrounded.
7. **FCM, Google sign-in and e-mail are optional and unconfigured here.** There are no credentials in the repository. Polling works without them; Google sign-in and e-mail verification require your own OAuth client and SMTP.
8. **Maps use public OpenStreetMap tiles** by default. That is fine for development and light personal use; production should use a paid tile provider and respect its usage policy.
9. **Not tested on a physical device in this environment.** The APK was built and its contents verified, but runtime behaviour (permissions dialogs, OEM quirks) still needs your two phones.
10. **Backend ships with 13 audit advisories** in transitive/direct dependencies whose fixes require major upgrades (Nest 12, nodemailer 10, schedule 12). Exposure and the upgrade plan are documented in [docs/SECURITY.md](docs/SECURITY.md#dependency-audit). The web app is clean.

---

## Permanent hosting

The demo link above is a **Cloudflare quick tunnel**. It is free and needs no account, but it dies when the tunnel process or the computer stops, and its hostname changes on every restart. For a URL that stays up:

1. **Database** â€” managed PostgreSQL (Railway, Neon, Supabase, Render).
2. **API** â€” deploy `backend/` (Dockerfile included) with `DATABASE_URL`, the JWT secrets, `TOKEN_PEPPER`, `LOCATION_ENCRYPTION_KEY`, `CORS_ORIGINS` and `WEB_PUBLIC_URL` pointing at your HTTPS web origin; run `prisma migrate deploy` (or `db push` for a first setup).
3. **Web** â€” deploy `web/` to Vercel/Netlify or the included Dockerfile, with `API_INTERNAL_URL` set to the API's public HTTPS URL at build **and** run time (`NEXT_PUBLIC_SITE_URL` is baked at build).
4. **Android** â€” set the server address to the API HTTPS URL; release builds reject plain `http://`.
5. Set the repository homepage (Settings â†’ About â†’ Website) to the new URL so visitors land on the app, not the code.

Full checklist: [docs/SETUP.md](docs/SETUP.md) and [docs/SECURITY.md](docs/SECURITY.md).

---

## Documentation

| Document | Contents |
| --- | --- |
| [docs/SETUP.md](docs/SETUP.md) | Every prerequisite, environment variable, local/LAN/production setup, FCM, maps, troubleshooting |
| [docs/API.md](docs/API.md) | Full REST reference: auth, owner, device, notifications, errors, command lifecycle |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, crypto, privacy, permissions, audit findings, deployment checklist |
| [docs/TESTING.md](docs/TESTING.md) | What was verified, exact commands and results, manual two-phone checklist |

---

## Responsible use

Use this software only on phones you own or are explicitly authorised to manage, and only where doing so is legal. The location-history feature requires the account owner's consent and can be switched off or deleted at any time. Do not use it to track another person without their knowledge.

## License

Private/unlicensed. All rights reserved by the project owner.
