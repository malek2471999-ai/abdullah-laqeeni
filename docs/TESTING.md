# Testing & build report

Snapshot: **2026-10-27**. This page records exactly what was executed, what passed, what failed and was fixed, and what still requires hardware or external credentials.

- [Environment](#environment)
- [Results summary](#results-summary)
- [Backend](#backend)
- [Web](#web)
- [Android](#android)
- [Static checks](#static-checks)
- [Bugs found and fixed during verification](#bugs-found-and-fixed-during-verification)
- [Manual two-phone acceptance test](#manual-two-phone-acceptance-test)
- [Not verified here (and why)](#not-verified-here-and-why)
- [Reproduce the whole verification](#reproduce-the-whole-verification)

---

## Environment

| Item | Value |
| --- | --- |
| OS | Windows 11 (PowerShell 5.1) |
| Node.js | v24.19.0 |
| npm | 11.x |
| JDK | 17.0.20.1+1 (Temurin) |
| Android SDK | Platform 35, Build-Tools 35.0.0, Platform-Tools |
| Gradle | 8.14.3 (wrapper) |
| AGP / Kotlin | 8.7.3 / 2.0.21 |
| PostgreSQL | **not installed / not running** |
| Docker | **not installed** |
| Physical Android device | **none** |
| Firebase / SMTP / Google OAuth | **not configured** |

Because PostgreSQL and Docker were unavailable, the automated backend tests use an in-memory Prisma stub, and no live HTTP/database integration test was possible. This is called out again under [Not verified here](#not-verified-here-and-why).

---

## Results summary

| Check | Command | Result | Duration |
| --- | --- | --- | --- |
| Backend build | `npm.cmd run build` | ✅ exit 0, emits `dist/main.js` | ~10 s |
| Backend unit tests | `npm.cmd test` | ✅ 8/8 passing | 65.2 s |
| Backend HTTP smoke | `npm.cmd run test:e2e` | ✅ 4/4 passing | 132.2 s |
| Prisma schema | `npx prisma validate` (with `DATABASE_URL`) | ✅ valid | ~3 s |
| Backend audit | `npm.cmd audit --omit=dev` | ⚠️ 13 advisories (8 moderate, 5 high) | ~5 s |
| Web i18n | `npm.cmd run check:i18n` | ✅ 348 keys × 3 locales, 278 referenced | ~1 s |
| Web typecheck | `npm.cmd run typecheck` | ✅ no errors | ~40 s |
| Web build | `npm.cmd run build` | ✅ 28 routes + Proxy | ~60 s |
| Web audit | `npm.cmd audit --omit=dev` | ✅ 0 vulnerabilities | ~5 s |
| Android debug | `.\gradlew.bat :app:assembleDebug` | ✅ BUILD SUCCESSFUL | 2 m 56 s (incremental) |
| Android release | `.\gradlew.bat :app:assembleRelease` | ✅ BUILD SUCCESSFUL (R8, resource shrinking) | 13 m 53 s |
| APK signature (debug) | `apksigner verify --print-certs` | ✅ signed by Android Debug key | ~2 s |
| APK identity | `aapt2 dump badging` | ✅ `com.abdullah.laqeeni.debug`, v1.0.0-debug, min 26, target 35 | ~2 s |
| Release APK identity | `aapt2 dump badging` | ✅ `com.abdullah.laqeeni`, v1.0.0, min 26, target 35 | ~2 s |
| Android string keys | `node check-strings.cjs` | ✅ 209 used / 240 defined, 0 missing EN/AR/FR | <1 s |
| XML well-formedness | PowerShell `XmlDocument.Load` | ✅ manifest + 5 XML configs | <1 s |

> On PowerShell 5.1, `npm.cmd test 2>&1` reports `Exited with code 1` for Jest's stderr banner even when all tests pass. The Jest summary (`Tests: 8 passed`) and `$LASTEXITCODE` of the underlying process are the source of truth. The table reflects the Jest results.

---

## Backend

### Unit tests — `backend/test/crypto.service.spec.ts`

```
PASS test/crypto.service.spec.ts
  CryptoService
    √ round-trips text and produces a versioned ciphertext
    √ uses a fresh IV for every encryption
    √ rejects tampered ciphertext (GCM authentication)
    √ round-trips coordinates and rejects non-finite values
    √ hashes tokens deterministically and compares in constant time
    √ changing the pepper invalidates previously hashed tokens
    √ creates eight-character pairing codes from an unambiguous alphabet
    √ normalises user-entered pairing codes

Tests: 8 passed, 8 total
```

What this proves: AES-256-GCM confidentiality + integrity (tampering throws), unique IVs, coordinate round-tripping, HMAC determinism/constant-time comparison, pepper rotation invalidation, pairing-code shape and normalisation.

### HTTP smoke tests — `backend/test/app.e2e-spec.ts`

```
PASS test/app.e2e-spec.ts
  Abdullah Laqeeni API (e2e)
    √ GET / identifies the service
    √ GET /health reports database and push state
    √ rejects unauthenticated device listing
    √ validates registration input before touching the database

Tests: 4 passed, 4 total
```

The E2E suite boots the real Nest application with an in-memory Prisma stub, so it verifies module wiring, guards, validation pipes and routing without PostgreSQL.

### Prisma

```
$env:DATABASE_URL="postgresql://laqeeni:laqeeni_dev_password@localhost:5432/laqeeni?schema=public"
npx prisma validate
# The schema at prisma\schema.prisma is valid 🚀
```

`validate` requires `DATABASE_URL` to be set even though it does not connect.

### Build

`npm run build` → `nest build` → exit 0. Output now contains `dist/main.js`, matching `npm start` and the Dockerfile `CMD ["node", "dist/main.js"]`.

### Audit

```
13 vulnerabilities (8 moderate, 5 high)
```

All require semver-major upgrades (Nest 12 / nodemailer 10 / schedule 12). A non-force `npm audit fix` was attempted, produced **26** advisories because newer transitive versions carry new 2026 advisories, and was reverted by restoring `package-lock.json` and running `npm ci`. See [SECURITY.md](SECURITY.md#dependency-audit) for the exposure analysis and upgrade plan.

---

## Web

```powershell
cd web
npm.cmd run check:i18n
# i18n: 348 keys x 3 locales, 278 referenced, 70 unused.
# i18n: OK

npm.cmd run typecheck
# (no output; exit 0)

npm.cmd run build
# ✓ Compiled successfully
# 28 route entries incl. /api/proxy/[...path], /dashboard, /devices/[id]/*, /security, /settings,
# /sitemap.xml and /_not-found; plus ƒ Proxy (Middleware)

npm.cmd audit --omit=dev
# found 0 vulnerabilities
```

The build was run with Next.js **16.4.3**, React **19.3.1**, MapLibre **6.16.0**. The application uses async `cookies()`, `params` and `searchParams`, and `middleware.ts` is named `proxy.ts` with `export async function proxy(...)` per Next 16 conventions.

Dashboard pages are server-rendered against the API. Without a running API/database they cannot render authenticated data, so the production build only proves compilation/routing, not live data.

---

## Android

### Debug build

```powershell
$env:JAVA_HOME="C:\...\jdk-17.0.20.1+1"
$env:ANDROID_HOME="C:\...\sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
cd android
.\gradlew.bat :app:assembleDebug --console=plain
# BUILD SUCCESSFUL in 2m 56s (incremental, after a string-resource fix)
# 41 actionable tasks: 6 executed, 35 up-to-date
```

Artifact:

| Property | Value |
| --- | --- |
| Path | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Size | 67,155,446 bytes (~64.0 MiB) |
| SHA-256 | `45B35AC8AC2400623011077202F3DA0A913A1F20BF07AE7634A0AE16500356AE` |
| Package | `com.abdullah.laqeeni.debug` |
| Version | `1.0.0-debug` (versionCode 1) |
| minSdk / targetSdk | 26 / 35 |
| Label (Arabic) | عبدالله لاقيني |
| Signature | `CN=Android Debug`, SHA-256 cert `dafcf44c…17e2d` |
| Signing check | `apksigner verify` exit 0 |

### Release build

```powershell
.\gradlew.bat :app:assembleRelease
# BUILD SUCCESSFUL in 13m 53s
# R8 minify + shrinkResources completed
```

| Property | Value |
| --- | --- |
| Path | `android/app/build/outputs/apk/release/app-release-unsigned.apk` |
| Size | 47,461,328 bytes (~45.3 MiB) |
| SHA-256 | `83C2797B9B0060F26CC135A117E77119D7C679FB5B87099250FC4745C8424973` |
| Package | `com.abdullah.laqeeni` |
| Version | `1.0.0` |
| Status | **Unsigned** — sign with your own keystore before installing/distributing |

Release is unsigned because no keystore is committed (by design). Signing steps: [SETUP.md §6](SETUP.md#6-android-app).

### What the builds prove

- Kotlin/Compose/Hilt/KSP/Room/MapLibre/ZXing code compiles for both debug and release.
- Hilt annotation processing and WorkManager integration are valid.
- R8 shrinking succeeds, so the code keeps its required classes.
- The manifest merges, permissions are declared, and the Arabic label/package are correct.
- The APK is a valid, signed (debug) package.

They do **not** prove runtime behaviour: permission flows, alarms on a real audio policy, lock-screen overlays, OEM background killing, FCM, or actual GPS fixes.

---

## Static checks

### Android string resources

```powershell
node check-strings.cjs
# USED 209 HAVE 240
# MISSING EN: (none)
# UNUSED EN: 31
# MISSING AR: (none)
# UNUSED AR: 31
# MISSING FR: (none)
# UNUSED FR: 31
```

Every `R.string.*` reference exists in all three locales. The 31 unused keys are kept intentionally (labels for features that are documented but not wired to a button yet, and future-ready strings).

### XML parsing

All of the following load as well-formed XML:

- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values-ar/strings.xml`
- `android/app/src/main/res/values-fr/strings.xml`
- `android/app/src/main/res/xml/network_security_config.xml`
- `android/app/src/debug/res/xml/network_security_config.xml`

### Web i18n

`check-i18n.mjs` validates key parity across EN/AR/FR **and** statically extracts `dict.<key>` usage, so a typo in a dictionary key fails the build check. 70 keys are currently unused (reserved for states not rendered yet); unused keys are allowed, missing keys are not.

---

## Bugs found and fixed during verification

1. **Production start pointed at a non-existent file.** `nest build` emitted `dist/src/main.js` because `prisma/seed.ts` was included by `tsconfig.build.json`, making the TypeScript root the project root. `npm start`, the Dockerfile and Docker Compose all expect `dist/main.js`. Fixed by adding `"prisma"` to `exclude` in `backend/tsconfig.build.json`; rebuild confirmed `dist/main.js` and `dist/app.module.js` at the root of `dist/`.
2. **Foreground service type crash on missing permission.** `GuardianService` requested a `location|dataSync` foreground type unconditionally; on Android 14+ starting with a type whose permission is not granted throws. Fixed by granting `dataSync` only when location is missing, falling back, and stopping cleanly if `startForeground` still fails. Debug + release builds pass after the change.
3. **Kotlin 2.0 / MapLibre / Compose API drift.** Several compile errors were resolved earlier (explicit serializers, `CurrentLocationRequest`, async MapLibre style API, `LocalContext`, state setters, `@ApplicationContext`). Both build types now compile.
4. **Dependency “fix” that made things worse.** `npm audit fix` increased advisories from 13 to 26; reverted via lockfile restore + `npm ci`, then re-verified the build.

---

## Manual two-phone acceptance test

This is the part that must be executed on real hardware. The full script is in [SETUP.md §7](SETUP.md#7-two-phone-lan-test); the acceptance criteria are:

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Backend `/health` from the computer | `200`, `database: ok` |
| 2 | `http://<LAN-IP>:4000/` from each phone's browser | JSON banner |
| 3 | Register account on phone A, sign in on phone B | Both authenticated |
| 4 | A creates pairing code, B enters it | Device appears once on B and A; token stored on A |
| 5 | Code reused or expired | `409` / `400`, no second device |
| 6 | Locate from B | A uploads a fix within ≤20 s; `locationLive: true` |
| 7 | Ring from B | A rings on the alarm stream, vibrates, flashes (hardware permitting) |
| 8 | Stop-ring | Sound stops; pending rings cancelled |
| 9 | Lost Mode on | A shows full-screen recovery message over the lock screen |
| 10 | Lost Mode off | Overlay disappears, normal UI returns |
| 11 | Message from B | A displays/showcases the message; `lostMessage` updated |
| 12 | A offline, command sent | Status stays `PENDING`; nothing executes; after reconnection it runs within ≤20 s or expires |
| 13 | History consent off | No new history points; current location still updates |
| 14 | Unlink device on B | A stops syncing, token rejected (`401`) |
| 15 | Account deletion | Re-login fails; device data gone |
| 16 | 2FA enable → sign out → sign in | Challenge required, wrong code rejected, correct code accepted |
| 17 | Session revoke from dashboard | Other session gets `401` at next refresh |
| 18 | Arabic/English/French switch | UI reflows RTL, all strings translated |
| 19 | Tablet ≥720 dp | Navigation rail layout, no clipped content |
| 20 | Do Not Disturb on | Alarm respects DND (may be silent) — documented, not bypassed |

Record device models and Android versions when you run this; OEM behaviour (Xiaomi, Huawei, Oppo, Samsung) is the most likely source of background-service surprises.

---

## Not verified here (and why)

| Missing verification | Blocker | How to close it |
| --- | --- | --- |
| Live backend ↔ PostgreSQL CRUD | No PostgreSQL/Docker | Run `docker compose up -d db`, `prisma db push`, start API, execute the curl flow |
| Seed execution | Same | `npm run seed` then sign in as demo |
| Real pairing/command round-trip | Same + phone | Follow SETUP §7 |
| APK install/runtime | No device/emulator | `adb install`, grant permissions, run scenarios 6–14 |
| FCM delivery | No Firebase project | Follow SETUP §8 |
| Google sign-in | No OAuth client | Create a web client, set `GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| Verification/reset e-mail | No SMTP | Configure SMTP and test the links |
| Production TLS/proxy | No domain | Deploy behind Caddy/nginx, set HTTPS URLs |
| Load/performance | Single-process local only | k6/artillery against the polling endpoints |
| Accessibility audit | Not run | TalkBack + axe-core; RTL checks on a device |
| Push/notification permission edge cases | Android 13/14 device | Manual matrix on API 26, 33, 34, 35 |
| Release signing | No keystore | Generate one; sign and verify |

### Test coverage gaps

- No Android unit/instrumentation tests are committed (test dependencies exist, but the suite is empty). The Android layer is verified by compilation only.
- Backend tests cover crypto and HTTP wiring; business logic (pairing, command dedupe, retention) is not unit-tested. A database-backed integration suite is the next priority.
- Web has no component/E2E tests; verification is i18n + types + production build.
- No performance or soak test.

---

## Reproduce the whole verification

```powershell
# Backend
cd backend
npm ci
npm run build
npm test
npm run test:e2e
$env:DATABASE_URL="postgresql://laqeeni:laqeeni_dev_password@localhost:5432/laqeeni?schema=public"
npx prisma validate
npm audit --omit=dev

# Web
cd ..\web
npm ci
npm run verify
npm run build
npm audit --omit=dev

# Android
cd ..\android
$env:JAVA_HOME="C:\path\to\jdk-17"
$env:ANDROID_HOME="C:\path\to\android-sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
.\gradlew.bat :app:assembleDebug :app:assembleRelease

# Strings / XML (from the repo root)
cd ..
node check-strings.cjs
```

To turn this into CI later: run the same commands in a Linux container with a PostgreSQL service, add `prisma migrate deploy`, and publish the APK as an artifact.
