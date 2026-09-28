# HOUSE HELP — Production Handoff (मराठी)

दिनांक: 26 सप्टेंबर 2026

## स्पष्ट निष्कर्ष

हा release candidate आधीपेक्षा लक्षणीय सुरक्षित व build-ready आहे; पण अजून **Google Play Production rollout साठी अंतिम मंजूर नाही**. Software ला 100% bug-free हमी देता येत नाही. Backend critical-domain coverage gate आता PASS आहे: lines 73.65%, statements 76.56%, functions 83.44% आणि branches 61.07%.

Owner credentials शिवाय Razorpay/MSG91/Firebase चे live E2E, EAS signed AAB, Play Console upload आणि closed testing पूर्ण करता येत नाही.

## या pass मध्ये पूर्ण केलेले काम

- Root `package-lock.json` तयार केला आणि CI/Docker मध्ये `npm ci` लागू केले.
- Customer व Provider apps Expo SDK 52 वरून Expo SDK 57 वर upgrade केले.
- React Native 0.86.3, React 19.2.3 आणि Expo-compatible native packages align केले.
- Duplicate React dependency हटवली; दोन्ही Expo Doctor checks 21/21 PASS.
- Android target/compile API 36 config कायम ठेवली.
- iOS deployment target 16.4 केला.
- नवीन Expo splash-screen plugin आणि system UI support जोडले.
- दोन्ही Android native prebuilds PASS.
- Next.js 16.3.6, Firebase Admin 14.5.0 आणि Vitest 5.0.2 वर security upgrade केले.
- Prisma Client generate workflow release checks मध्ये जोडला.
- PostgreSQL initial migration तयार केली: `apps/backend/prisma/migrations/20260926083000_initial/migration.sql`.
- Backend test runner मधून generated `dist/**` tests exclude केले; आता source tests duplicate चालत नाहीत.
- `quality:check` मध्ये typecheck, tests, static security, coverage आणि builds अनिवार्य केले.
- Customer/Provider app मधील production HTTPS API आणि EAS project ID validation तपासली.
- Public `/privacy`, `/terms`, `/refund`, `/cancellation` आणि `/delete-account` pages तयार व production-build verified केल्या.
- npm dependency overrides द्वारे patched `deepmerge-ts` आणि `uuid` वापरून audit 0 vulnerabilities केला.
- Play Store guide सध्याच्या API-integrated app स्थितीनुसार update केला.

## पडताळणी निकाल

| तपासणी | निकाल |
|---|---|
| सर्व workspace TypeScript checks | PASS |
| Backend source tests | 56/56 PASS |
| Static security scan | PASS — 82 source files |
| Backend build | PASS |
| Admin Next.js production build | PASS |
| Customer Expo Doctor | PASS — 21/21 |
| Provider Expo Doctor | PASS — 21/21 |
| Customer Android prebuild | PASS |
| Provider Android prebuild | PASS |
| Static Store readiness gate | PASS |
| Backend coverage threshold | **PASS** — lines 73.65%, statements 76.56%, functions 83.44%, branches 61.07% |
| npm audit | **PASS — 0 vulnerabilities** |
| Render PostgreSQL migration | **PASS** — `20260926083000_initial` applied |
| Render backend health | **PASS** — `/health/live` 200; `/health/ready` DB + Redis `ok` |
| Render admin + legal pages | **PASS** — public HTTPS वर 200 |
| Admin → backend CORS | **PASS** — staging origin preflight 204 |
| Signed EAS AAB | Owner login/credentials आवश्यक |
| Live Razorpay/MSG91/Firebase E2E | Real credentials आवश्यक |
| Real-device/closed test | बाकी |

## Production release थांबवणारे blockers

### P0 — अनिवार्य

1. **Live integrations:** Razorpay test/live controlled transaction, webhook signature/replay/duplicate test; MSG91 OTP delivery/failure/rate limit; Firebase push allow/deny/token refresh test.
2. **Signed builds:** दोन्ही apps चे EAS production AAB तयार करा आणि Internal Testing ला upload करा.
3. **Real devices:** low-end, current Android आणि मराठी font/large-text device वर complete E2E करा.
4. **Play declarations:** Data Safety, App Access, permissions, content rating आणि reviewer OTP/test account actual behavior प्रमाणे भरा.
5. **Closed testing:** Play Console ने दाखवलेली tester/day requirement पूर्ण करा.
6. **Production hosting:** Free staging services paid production plan/domain वर हलवा; `NODE_ENV=production`, real provider credentials आणि backup/restore drill पूर्ण करा.
7. **Regression:** प्रत्येक release आधी `npm run release:check`, Expo Doctor, native prebuild आणि `npm audit` पुन्हा चालवा.

## Live staging deployment

> Render Free plan testing/staging साठी आहे. Sleep/cold-start होऊ शकतो; production SLA साठी paid plan आवश्यक आहे.

- Backend: `https://house-help-api-staging.onrender.com`
- Admin: `https://house-help-admin-staging.onrender.com`
- Privacy: `https://house-help-admin-staging.onrender.com/privacy`
- Terms: `https://house-help-admin-staging.onrender.com/terms`
- Refund: `https://house-help-admin-staging.onrender.com/refund`
- Cancellation: `https://house-help-admin-staging.onrender.com/cancellation`
- Account deletion: `https://house-help-admin-staging.onrender.com/delete-account`

Backend container startup आधी `prisma migrate deploy` चालवतो. Render migration, live/ready health, admin pages, embedded API URL आणि CORS हे live deployment वर verify केले आहेत. Staging मध्ये `NODE_ENV=development`, console SMS आणि FCM disabled आहेत; real Razorpay/MSG91/Firebase credentials नसल्यामुळे त्याला production म्हणून वापरू नका.

## Database setup — basic पासून

```bash
cp .env.production.example .env.production
# DATABASE_URL मध्ये managed PostgreSQL TLS connection URL भरा.

npm ci
npm run prisma:generate -w @house-help/backend
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
```

Production मध्ये `prisma migrate dev`, `db push` किंवा demo seed चालवू नका. Migration आधी backup घ्या. Deploy नंतर `/health/live` आणि `/health/ready` दोन्ही तपासा.

## API/secret setup

Hosting secret manager मध्येच भरा:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_SECRET=<48+ random chars>
REFRESH_TOKEN_SECRET=<वेगळा 48+ random secret>
OTP_PEPPER=<random secret>
DATA_ENCRYPTION_KEY=<strong encryption key>
CORS_ORIGINS=https://admin.<domain>
PAYMENT_GATEWAY=razorpay
PAYMENT_API_KEY=<live/test key>
PAYMENT_SECRET=<secret>
PAYMENT_WEBHOOK_SECRET=<webhook secret>
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=<secret>
MSG91_TEMPLATE_ID=<approved template>
FCM_ENABLED=true
FIREBASE_PROJECT_ID=<id>
FIREBASE_CLIENT_EMAIL=<service account email>
FIREBASE_PRIVATE_KEY=<private key>
METRICS_TOKEN=<random secret>
```

Mobile/EAS environment:

```text
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://api.<domain>
EXPO_PUBLIC_CUSTOMER_EAS_PROJECT_ID=<customer EAS project ID>
EXPO_PUBLIC_PROVIDER_EAS_PROJECT_ID=<provider EAS project ID>
```

## अंतिम quality commands

Node 22 LTS आणि npm 10/11 वापरा:

```bash
npm ci
npm run release:check
npm run store:gate
npm audit
```

`npm run release:check` सध्या PASS आहे. पुढील code/config बदलानंतर ते पुन्हा PASS झाल्याशिवाय AAB Production track ला देऊ नका.

## EAS आणि Play Store क्रम

```bash
# Expo account login
npx eas-cli login

# Customer
cd apps/customer-app
npx eas-cli init
npm run build:android

# Provider
cd ../provider-app
npx eas-cli init
npm run build:android
```

1. पहिला AAB Play Console → Internal testing मध्ये manual upload करा.
2. Pre-launch report मधील crash/ANR/security warnings सोडवा.
3. Internal नंतर Closed testing करा.
4. सर्व P0 बंद झाल्यावर staged Production rollout: 5% → 20% → 50% → 100%.
5. प्रत्येक टप्प्यावर crash-free users, ANR, API 5xx, latency, OTP/payment failures आणि support tickets monitor करा.

पूर्ण operational checklist साठी `docs/PLAY_STORE_DEPLOYMENT_MR.md` वापरा.
