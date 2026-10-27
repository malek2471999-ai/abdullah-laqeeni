# Setup guide

Everything needed to run Abdullah Laqeeni locally, on a LAN with two phones, and in production.

- [1. Prerequisites](#1-prerequisites)
- [2. Secrets](#2-secrets)
- [3. Database](#3-database)
- [4. Backend](#4-backend)
- [5. Web dashboard](#5-web-dashboard)
- [6. Android app](#6-android-app)
- [7. Two-phone LAN test](#7-two-phone-lan-test)
- [8. Firebase Cloud Messaging](#8-firebase-cloud-messaging)
- [9. Maps and tile providers](#9-maps-and-tile-providers)
- [10. Production deployment](#10-production-deployment)
- [11. Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

| Tool | Version used | Needed for |
| --- | --- | --- |
| Node.js | 24.19.0 (20+ works) | API, dashboard, scripts |
| npm | 11.x (10+ works) | Dependency install |
| PostgreSQL | 16 | Database |
| Docker Desktop / Engine | Any recent | Easiest database and full stack |
| JDK | 17 | Android build |
| Android SDK | Platform 35, Build-Tools 35 | Android build |
| Android Studio | Latest (optional) | IDE, emulator, device deployment |

The repository was built and verified with:

- Windows 11, PowerShell 5.1
- JDK `C:\Users\<you>\...\jdk-17.0.20.1+1`
- Android SDK at a local path with `platforms;android-35`, `build-tools;35.0.0`, `platform-tools`

> On Windows, use `npm.cmd` if your PowerShell execution policy blocks `npm.ps1`.

---

## 2. Secrets

Generate real values before running anything beyond a throwaway demo. PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # JWT secrets, TOKEN_PEPPER
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" # LOCATION_ENCRYPTION_KEY
```

Rules:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOKEN_PEPPER`: **≥ 32 characters**, all different.
- `LOCATION_ENCRYPTION_KEY`: exactly 32 bytes, base64 or hex. **Changing it makes existing coordinates undecryptable.**
- In development, missing/invalid values fall back to an insecure dev key so the app can run; in `NODE_ENV=production` the API refuses to boot.
- Never commit `.env`. Only `.env.example` belongs in Git.

---

## 3. Database

### Option A — Docker (recommended)

```powershell
cd abdullah-laqeeni
docker compose up -d db
docker compose ps            # wait for "healthy"
```

This starts PostgreSQL 16 on `localhost:5432` with database `laqeeni`, user `laqeeni`, password `laqeeni_dev_password` (development only).

### Option B — existing PostgreSQL

Create a database and user, then use a connection string like:

```
postgresql://laqeeni:your_password@localhost:5432/laqeeni?schema=public
```

### Schema

The project ships a Prisma schema but no migration history (it was developed with `db push`).

```powershell
cd backend
$env:DATABASE_URL="postgresql://laqeeni:laqeeni_dev_password@localhost:5432/laqeeni?schema=public"
npx prisma db push          # create/update tables
npx prisma studio           # optional visual inspection
npm run seed                # optional demo data, development only
```

For production, create a real baseline migration once you have a database:

```powershell
npx prisma migrate dev --name init   # against a disposable dev database
# commit backend/prisma/migrations, then on the server:
npx prisma migrate deploy
```

---

## 4. Backend

```powershell
cd backend
Copy-Item .env.example .env
# edit .env: set DATABASE_URL + the four secrets
npm install
npm run build
npm run start:dev
```

Verify:

```powershell
curl.exe http://localhost:4000/
curl.exe http://localhost:4000/health
```

Expected `GET /`:

```json
{ "name": "Abdullah Laqeeni API", "version": "1.0.0", "status": "online", "documentation": "/health" }
```

Expected `GET /health`: `{"status":"ok","database":"ok","push":"polling-only","time":"…"}`. If the database is unreachable it returns **503** `{"status":"degraded","database":"unreachable"}`.

Useful scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Compiles to `dist/` (`node dist/main.js`) |
| `npm run start:dev` | Watch mode |
| `npm run prisma:push` | Sync schema without migrations |
| `npm run prisma:deploy` | Apply committed migrations |
| `npm run seed` | Idempotent demo owner/device/pairing code |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | HTTP smoke tests with an in-memory Prisma stub |
| `npm run lint` | `tsc --noEmit` |

### Environment reference

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `PORT` | `4000` | API port |
| `NODE_ENV` | `development` | `production` enforces secrets and disables dev token exposure |
| `API_PUBLIC_URL` | `http://localhost:4000` | Links in e-mails, API self-reference |
| `WEB_PUBLIC_URL` | `http://localhost:3000` | Verification/reset links point here |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `ACCESS_TOKEN_TTL` | `15m` | Access JWT lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Session lifetime |
| `GOOGLE_CLIENT_ID` | empty | Enables `POST /auth/google` for ID tokens from that client |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | empty / 587 | E-mail delivery |
| `EXPOSE_DEV_TOKENS` | `true` | Returns verification/reset tokens in responses (development only) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | empty | Single-line Firebase Admin service account |

Without SMTP, verification and reset e-mails are logged to the API console. With `EXPOSE_DEV_TOKENS=true`, the corresponding token is also returned in the JSON response so you can finish the flow locally. Set it to `false` in production.

### Seeded demo data

`npm run seed` creates or updates:

| Item | Value |
| --- | --- |
| Owner | `demo@laqeeni.app` / `Laqeeni#2026` (name: عبدالله) |
| Device | `Galaxy S23 — تجريبي`, id `11111111-1111-4111-8111-111111111111` |
| Device token | `11111111-1111-4111-8111-111111111111.demo-device-secret-do-not-use-in-production-0001` |
| Pairing code | `DEMO2026` (formatted `DEMO-2026`), expires in 10 minutes |
| Sample data | battery/network status, encrypted location + history, commands, notification |

The seed refuses to run when `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=true`.

---

## 5. Web dashboard

```powershell
cd web
Copy-Item .env.example .env.local
# API_INTERNAL_URL=http://localhost:4000
npm install
npm run dev
```

Open <http://localhost:3000>, sign in with the demo owner (or register).

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build/serve |
| `npm run check:i18n` | EN/AR/FR key parity + static `dict.*` usage |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | i18n + typecheck |

Notes:

- Tokens live in `httpOnly` cookies (`laqeeni_access`, `laqeeni_refresh`). The browser calls `/api/proxy/<backend-path>`; the server attaches the bearer token and refreshes it once on 401. Do not add client-side code that expects a raw token.
- `NEXT_PUBLIC_API_URL` is only used for documentation links; the server uses `API_INTERNAL_URL`.
- `NEXT_PUBLIC_SITE_URL` is read at build time to produce `sitemap.xml`; restarting the server alone will not pick up a new value.
- Dashboard pages are server-rendered and require the API **and** database to be up. If either is down, authenticated pages fail; the login page still renders.

---

## 6. Android app

### Toolchain

```powershell
# Point Gradle at your SDK (or set ANDROID_HOME / ANDROID_SDK_ROOT)
Set-Content android\local.properties "sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk"
```

`local.properties` is machine-specific and git-ignored. The project uses:

- Gradle 8.14.3, AGP 8.7.3, Kotlin 2.0.21, Compose BOM 2024.12.01
- `compileSdk`/`targetSdk` 35, `minSdk` 26, Java 17
- Hilt 2.52, Room 2.6.1, WorkManager 2.10.0, MapLibre 11.5.2, ZXing 4.3.0

### Build and install

```powershell
cd android
.\gradlew.bat :app:assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

Debug specifics:

- Application id `com.abdullah.laqeeni.debug` (release: `com.abdullah.laqeeni`).
- Cleartext HTTP allowed, including user CAs (for a LAN proxy).
- Default API `http://10.0.2.2:4000/` — that address only works from the Android **emulator**. On a real phone, change *Settings → Server address*.

### Release build

1. Create a keystore (once):

   ```powershell
   keytool -genkeypair -v -keystore laqeeni-release.jks -alias laqeeni `
     -keyalg RSA -keysize 4096 -validity 10000 -storetype JKS
   ```

2. Add signing config to `android/app/build.gradle.kts` (or use `~/.gradle/gradle.properties` + a `signingConfigs` block). Keep the keystore and passwords out of Git.
3. Set your production API before building, either:
   - change `DEFAULT_API_BASE_URL` in the `release` block, or
   - ship with the default `https://api.laqeeni.app/` and host the API there.
4. Build:

   ```powershell
   .\gradlew.bat :app:assembleRelease
   ```

   Release enables R8/ resource shrinking and **disables cleartext HTTP**. The app will refuse to talk to an `http://` server.

5. Install with `adb install -r app\build\outputs\apk\release\app-release.apk` or distribute the APK/AAB directly.

### Optional Firebase

Drop `android/app/google-services.json` into place before building. The Google Services plugin is applied automatically only when that file exists. Without it the app still works, polling only.

### Permissions the app asks for

| Permission | Why | If denied |
| --- | --- | --- |
| Notifications | Persistent protection notification, alarms, messages | Service notification hidden; Android 13+ may block alarms UI |
| Fine/coarse location | Locate the phone | No location updates |
| Background location | Respond while screen is off | Protection runs as data-sync only; fewer location updates |
| Camera | QR pairing + torch | QR scan and flash unavailable; code entry still works |

No SMS, contacts, microphone, accessibility or device-admin permissions are requested.

---

## 7. Two-phone LAN test

Goal: phone **A** is protected, phone **B** finds/rings it, without Firebase or a public server.

1. **Server**: complete sections 3–4. Make sure `CORS_ORIGINS` includes `http://localhost:3000` (only needed for the dashboard).
2. **LAN address**: on the computer, run `ipconfig` and note the IPv4 address of the Wi-Fi/Ethernet adapter, e.g. `192.168.1.20`.
3. **Firewall**: allow inbound TCP 4000 (PowerShell as Administrator):

   ```powershell
   New-NetFirewallRule -DisplayName "Laqeeni API 4000" -Direction Inbound `
     -Protocol TCP -LocalPort 4000 -Action Allow -Profile Private
   ```

4. **Reachability**: from phone B's browser open `http://192.168.1.20:4000/`. You should see the JSON service banner. If not, the phones are on a different network/guest Wi-Fi, or the firewall blocks it.
5. **Build/install** the debug APK on both phones (section 6).
6. **Both phones**: *Settings → Server address* → `http://192.168.1.20:4000/` → *Save server*. Trailing slash is normalised.
7. **Phone A**: register a new account (or sign in). *Link this phone → Create a pairing code*. Keep the 8-character code visible (10 minutes).
8. **Phone B**: sign in with the **same account** → *Devices → Add device → Another phone* → type the code or *Scan QR*. Phone A shows as linked.
9. **Phone A**: grant notifications + location, optionally background location, then start the protection service (*Settings → Protection service*). A persistent notification confirms it.
10. **Phone B**: open the device → *Request fresh location* → wait up to ~20 s → the map/detail shows a fresh point.
11. **Ring**: *Start loud alarm*. Phone A should ring/flash/vibrate. *Stop alarm* cancels pending repeats; the on-device screen also has a stop button.
12. **Lost Mode**: enable it, set a message and contact phone. Lock phone A; the recovery overlay should appear over the lock screen.
13. **Offline behaviour**: disable Wi-Fi and mobile data on phone A. Send another command on phone B. It remains queued (status `PENDING`) and is **not** executed. Re-enable connectivity; it runs within ~20 s or expires.
14. **Unlink**: on phone B, *Device settings → Unlink and delete data*. Phone A loses its device token on next sync and stops uploading.

Troubleshooting a failed LAN test:

- `curl.exe http://192.168.1.20:4000/health` from the computer works but not from the phone → firewall or client isolation.
- Phone shows *Cannot reach the server* → wrong IP, server bound to another port, or the phone is on cellular only.
- Commands stay `PENDING` → protection service not running, device token revoked, or app was force-stopped.
- Location stale → background location denied, GPS off, or OEM battery optimisation killed the service.

---

## 8. Firebase Cloud Messaging

Polling is the default and needs no configuration. FCM only shortens command latency.

1. Create a Firebase project → add an Android app with package `com.abdullah.laqeeni` (and `com.abdullah.laqeeni.debug` if you want debug push).
2. Download `google-services.json` → `android/app/google-services.json`.
3. Project settings → Service accounts → generate a new private key.
4. Minify the JSON to one line and set it in `backend/.env`:

   ```powershell
   $json = Get-Content service-account.json -Raw | ConvertFrom-Json | ConvertTo-Json -Compress -Depth 20
   # put the single line into FIREBASE_SERVICE_ACCOUNT_JSON="..."
   ```

5. Restart the API. `GET /health` should report `"push":"fcm"`.
6. Rebuild the app. On first run the app registers its FCM token with the device endpoint (`POST /device/push-token`).

Push payloads are data-only (`{type:"COMMAND", commandId, deviceId, commandType}`). The app still fetches the command over authenticated HTTP — push never contains the command payload, so a spoofed push cannot trigger a command by itself. Without `google-services.json`, the Firebase messaging dependency remains but no token is issued; polling continues.

---

## 9. Maps and tile providers

- **Dashboard**: MapLibre GL JS with a raster style pointing at `https://a|b|c.tile.openstreetmap.org/{z}/{x}/{y}.png` (see `web/components/device-map.tsx`).
- **Android**: MapLibre Native with an inline OSM raster style (see `ui/components/LaqeeniMap.kt`).
- No API key is required. OSM's tile policy is not intended for heavy production traffic: switch to MapTiler, Stadia, Thunderforest, or your own tiles, and update the style URL in both places. Keep the attribution.
- If you prefer Google Maps, the coordinate data is plain WGS-84; replace the map component without touching the API.

---

## 10. Production deployment

### Docker Compose (single host)

```powershell
cd abdullah-laqeeni
# 1. Create backend/.env with production values (real secrets, NODE_ENV=production,
#    EXPOSE_DEV_TOKENS=false, CORS_ORIGINS=https://your-domain, API_PUBLIC_URL=...)
# 2. Build and start
docker compose up -d --build
docker compose logs -f api
```

The compose file:

- starts PostgreSQL 16 with a named volume,
- builds the API and runs `prisma db push` before `node dist/main.js`,
- builds the dashboard with `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_SITE_URL` build args,
- passes `API_INTERNAL_URL=http://api:4000` so the dashboard talks to the API over the internal network.

`NEXT_PUBLIC_SITE_URL` is baked into `sitemap.xml` during the build. Set it to the public dashboard URL before `docker compose build`, and rebuild after changing it. Runtime-only changes to that variable have no effect.

**Do not expose this directly to the internet without TLS.** Put Caddy/nginx/Traefik in front and terminate HTTPS:

```caddyfile
laqeeni.example.com {
    reverse_proxy /api/* localhost:3000
    reverse_proxy localhost:3000
}
api.laqeeni.example.com {
    reverse_proxy localhost:4000
}
```

Then set:

- `CORS_ORIGINS=https://laqeeni.example.com`
- `API_PUBLIC_URL=https://api.laqeeni.example.com`
- `WEB_PUBLIC_URL=https://laqeeni.example.com`
- Android release `DEFAULT_API_BASE_URL` to `https://api.laqeeni.example.com/`

### Checklist before going live

- [ ] Strong, distinct secrets; `NODE_ENV=production`; `EXPOSE_DEV_TOKENS=false`.
- [ ] HTTPS everywhere; no cleartext Android config (release build enforces this).
- [ ] `CORS_ORIGINS` restricted to your dashboard origin.
- [ ] Database not publicly reachable; automated `pg_dump` backups tested.
- [ ] Baseline Prisma migration committed and applied with `prisma migrate deploy`.
- [ ] Demo seed **not** run; `demo@laqeeni.app` cannot log in.
- [ ] SMTP configured so password reset and verification actually send.
- [ ] Reverse proxy sets `X-Forwarded-For`; the API trusts one proxy hop (`trust proxy = 1`).
- [ ] Firebase service account stored as a secret, not in Git.
- [ ] Monitoring on `/health`, log retention, disk alerts.
- [ ] Dependency upgrades scheduled (see [SECURITY.md](SECURITY.md#dependency-audit)).

### Backups

```powershell
docker compose exec db pg_dump -U laqeeni laqeeni > laqeeni-$(Get-Date -Format yyyyMMdd).sql
```

Restore with `psql`. Coordinate columns are encrypted with `LOCATION_ENCRYPTION_KEY`; back up the key separately and securely, or the history will be unreadable.

### Scaling notes

- The API is stateless; run multiple replicas behind a load balancer. Command polling is database-backed, so no sticky sessions are required.
- Web sockets are not used. If you add Redis later, use it for throttling and fan-out, not as the source of truth.
- The maintenance service runs inside the API process: keep at least one replica running.

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| API exits with `JWT_ACCESS_SECRET must be set to at least 32 characters` | Production mode + weak/missing secret | Generate 32+ char secrets |
| `P1001: Can't reach database server` | DB not running / wrong URL | `docker compose up -d db`, check `DATABASE_URL` |
| `prisma validate` fails with `Environment variable not found: DATABASE_URL` | No `.env` or shell var | Copy `.env.example`, or set `$env:DATABASE_URL` |
| Dashboard login says *network* | API down or `API_INTERNAL_URL` wrong | `curl http://localhost:4000/health` |
| Dashboard redirects to `/login?expired=1` constantly | API restarted with a new `JWT_ACCESS_SECRET`, or clock skew | Keep secrets stable; check system time |
| Android *Cannot reach the server* | Emulator default `10.0.2.2`, phone needs LAN IP | Set *Server address* |
| Android alarm is silent | DND, silent mode, alarm volume, or missing notification permission | Raise alarm volume, allow DND, grant notifications |
| Torch does nothing | No flash unit or camera in use | Expected; the UI reports *no usable flash* |
| Service dies in background | OEM battery optimisation | Disable restrictions for the app; enable autostart |
| `npm audit` shows backend advisories | Upstream majors available | See `docs/SECURITY.md#dependency-audit` |
| Next build fails on `cookies()`/`params` | Old Next 15 code | This project targets Next 16 async APIs; don't downgrade |
| `prisma generate` fails on Windows with file locks | Running API holding the client DLL | Stop the API, rerun |
