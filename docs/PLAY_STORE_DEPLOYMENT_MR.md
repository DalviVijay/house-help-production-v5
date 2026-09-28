# HOUSE HELP — Google Play Store प्रकाशन व Production Deployment (मराठी)

> **महत्त्वाचे:** `bug-free` अशी 100% हमी कोणत्याही software साठी देता येत नाही. खालील quality gates, real-device testing, security checks आणि closed testing पूर्ण झाल्यावरच Production release करा.

## 0. सध्याची release स्थिती

या repository मध्ये backend, admin panel, दोन API-integrated Expo apps, Docker/EAS configuration, initial PostgreSQL migration आणि release checks आहेत. Customer app मध्ये OTP, services, address, booking, Razorpay आणि account deletion; Provider app मध्ये OTP, jobs, status transitions, foreground tracking आणि account deletion जोडलेले आहे.

तरीही Play Store Production वर थेट publish करू नका. `docs/FINAL_PRODUCTION_HANDOFF_MR.md` मधील उरलेले blockers—विशेषतः 70% coverage gate, real provider credentials, signed AAB, real-device E2E आणि closed testing—पूर्ण करणे बंधनकारक आहे.

## 1. आवश्यक accounts व खर्च

1. Google Play Console developer account तयार करा आणि identity verification पूर्ण करा.
2. Expo account तयार करा.
3. Production backend hosting (Render/Railway/AWS), managed PostgreSQL, managed Redis, domain आणि HTTPS तयार ठेवा.
4. Razorpay live account/KYC आणि webhook access तयार ठेवा.
5. Firebase project (push notifications वापरणार असल्यास) तयार करा.
6. `privacy-policy`, `terms`, `refund`, `cancellation`, support email व account-deletion page सार्वजनिक HTTPS URL वर host करा.

नवीन personal Play developer account (13 नोव्हेंबर 2023 नंतर तयार केलेला) असल्यास Google च्या सध्याच्या नियमानुसार किमान 12 opted-in testers सोबत सलग 14 दिवस closed test करावा लागू शकतो. Play Console मध्ये दिसणारी requirement अंतिम मानावी.

## 2. Local prerequisites

- Git
- Node.js 22 LTS
- npm 10+
- Docker Desktop
- EAS CLI: `npm install -g eas-cli`
- Android Studio + emulator (local Android testing साठी)

```bash
unzip house-help-production.zip
cd house-help-prod
npm ci
```

पहिल्या यशस्वी install नंतर तयार झालेला `package-lock.json` commit करा. CI/production मध्ये त्यानंतर फक्त `npm ci` वापरा.

## 3. Local backend सुरू करा

```bash
cp .env.example .env
# .env मधील CHANGE/replace values सुरक्षित random values ने बदला

docker compose up -d postgres redis
npm run prisma:generate -w @house-help/backend
npm run prisma:migrate -w @house-help/backend
npm run prisma:seed -w @house-help/backend
npm run dev -w @house-help/backend
```

Health checks:

```bash
curl http://localhost:4000/health/live
curl http://localhost:4000/health/ready
```

## 4. Quality gate

```bash
npm run release:check
npm audit --omit=dev
```

यानंतर Android emulator आणि किमान दोन real Android devices वर खालील flow तपासा:

- signup/login/OTP/logout/token refresh
- address + serviceability
- service → slot → booking → coupon → final price
- Razorpay success, failure, cancel, duplicate callback आणि webhook
- provider accept/reject/status transitions
- foreground location permission deny/allow आणि tracking stop
- notifications deny/allow
- Marathi/English text, slow internet, offline, retry
- admin actions व role authorization
- account deletion, refund/cancellation आणि support

एकही P0/P1 defect open असल्यास Production release करू नका.

## 5. Production secrets तयार करा

Secrets Git, ZIP, screenshot किंवा chat मध्ये ठेवू नका. Hosting provider secret manager वापरा.

किमान backend values:

- `NODE_ENV=production`
- `DATABASE_URL` — managed PostgreSQL TLS URL
- `REDIS_URL` — managed Redis TLS URL
- `JWT_SECRET` — 32+ random characters
- `REFRESH_TOKEN_SECRET` — वेगळा 32+ random secret
- `OTP_PEPPER` — random secret
- `DATA_ENCRYPTION_KEY` — random high-entropy secret
- `CORS_ORIGINS=https://<admin-domain>`
- `PAYMENT_API_KEY`, `PAYMENT_SECRET`, `PAYMENT_WEBHOOK_SECRET`
- `METRICS_TOKEN`
- `APP_VERSION`, `GIT_SHA`
- FCM वापरल्यास `FCM_ENABLED=true`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Random secrets उदाहरण:

```bash
openssl rand -base64 48
```

## 6. Backend deploy (Render सोपा पर्याय)

1. Repository private GitHub repo मध्ये push करा.
2. Render Dashboard → **New Blueprint** → repository निवडा; `render.yaml` वापरा.
3. Managed PostgreSQL आणि Redis तयार/जोडा.
4. वरचे secrets Render Environment मध्ये भरा.
5. प्रथम database backup घ्या.
6. one-off migration चालवा:

```bash
npm run prisma:generate -w @house-help/backend
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
```

7. API deploy करा. Production मध्ये `prisma migrate dev` किंवा seed चालवू नका.
8. तपासा:

```bash
curl https://api.<your-domain>/health/live
curl https://api.<your-domain>/health/ready
```

9. Razorpay Dashboard मध्ये webhook URL सेट करा:

```text
https://api.<your-domain>/api/payments/webhook
```

Webhook secret backend secret शी जुळला पाहिजे.

## 7. Admin panel deploy

Vercel वर `apps/admin-panel` deploy करा आणि production API URL environment मध्ये द्या. Backend `CORS_ORIGINS` मध्ये फक्त exact admin HTTPS origin ठेवा. Admin login, RBAC आणि unauthorized requests तपासा.

## 8. Expo/EAS projects configure करा

```bash
eas login

cd apps/customer-app
eas init
# मिळालेला projectId सुरक्षित env/CI मध्ये EXPO_PUBLIC_CUSTOMER_EAS_PROJECT_ID म्हणून ठेवा

cd ../provider-app
eas init
# EXPO_PUBLIC_PROVIDER_EAS_PROJECT_ID म्हणून ठेवा
```

दोन्ही apps साठी production build environment:

```text
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://api.<your-domain>
EXPO_PUBLIC_CUSTOMER_EAS_PROJECT_ID=<customer-project-id>
EXPO_PUBLIC_PROVIDER_EAS_PROJECT_ID=<provider-project-id>
```

`in.househelp.customer` आणि `in.househelp.provider` package IDs एकदा Play Console वर वापरल्यानंतर बदलू नका.

## 9. Android policy check

31 ऑगस्ट 2026 पासून Google Play वर new apps/updates साठी Android 16 / API level 36 target आवश्यक आहे. या repository चा release verifier `targetSdkVersion=36` तपासतो. Build करण्यापूर्वी current Expo SDK compatibility आणि Play Console policy पुन्हा verify करा.

Permissions कमीत कमी ठेवा. Background location request करू नका. Location, camera आणि notification permission फक्त feature वापरण्याच्या क्षणी मागा.

## 10. Signed AAB build

Customer app:

```bash
cd apps/customer-app
npm run release:check
npx eas-cli build --platform android --profile production
```

Provider app:

```bash
cd apps/provider-app
npm run release:check
npx eas-cli build --platform android --profile production
```

EAS ने विचारल्यास Android signing key remote credentials मध्ये सुरक्षितपणे generate/store करा. Keystore backup व access फक्त owner/admin कडे ठेवा.

## 11. Play Console app तयार करा

दोन्ही apps स्वतंत्र Play Console apps म्हणून तयार करा:

1. App name, default language, app/game, free/paid निवडा.
2. Store listing पूर्ण करा: short/full description, icon, feature graphic, phone screenshots.
3. App access मध्ये login/OTP test credentials व reviewer steps द्या.
4. Ads declaration अचूक भरा.
5. Content rating questionnaire भरा.
6. Target audience आणि news-app declaration भरा.
7. Data safety form actual code/backend behavior प्रमाणे भरा.
8. Privacy policy URL द्या.
9. Account creation असल्यास in-app आणि web account deletion mechanism द्या.
10. Financial/payment, location आणि personal-data declarations अचूक भरा.

`docs/store/STORE_LISTING.md` व `docs/store/ASSET_CHECKLIST.md` starting point आहेत; placeholder screenshots वापरू नका.

## 12. पहिला upload आणि testing

पहिला AAB manual upload करणे सर्वात स्पष्ट आहे:

Play Console → Testing → Internal testing → Create release → AAB upload → release notes → rollout.

Internal testing नंतर:

- clean install
- upgrade install
- crash/ANR dashboard
- pre-launch report
- payment sandbox/live controlled transaction
- deep links/notifications
- low-end device performance

नवीन personal account असल्यास Closed testing मध्ये आवश्यक testers आणि दिवस पूर्ण करा; tester feedback नोंदवा आणि production-access questionnaire प्रामाणिकपणे भरा.

## 13. EAS Submit (पहिल्या manual setup नंतर)

Google Cloud service account तयार करा, Play Console API access द्या आणि key EAS Credentials मध्ये upload करा. JSON key repository मध्ये commit करू नका.

```bash
cd apps/customer-app
npm run submit:android

cd ../provider-app
npm run submit:android
```

सध्याचा `eas.json` internal track + draft release वापरतो. थेट 100% production rollout करण्यापेक्षा आधी internal/closed test करा.

## 14. Production rollout

1. Release candidate tag करा.
2. Database backup/restore test verify करा.
3. Backend compatibility smoke test करा.
4. Play Console pre-launch warnings सोडवा.
5. Staged rollout: 5% → 20% → 50% → 100%.
6. प्रत्येक टप्प्यावर crash-free users, ANR, payment failures, API 5xx, latency आणि support tickets पाहा.
7. गंभीर समस्या असल्यास rollout halt करा; backend rollback/runbook वापरा. Android versionCode कमी करून rollback होत नाही—fixed higher versionCode build द्यावा लागतो.

## 15. Go-live checklist

- [ ] P0/P1 defects शून्य
- [ ] `npm run release:check` PASS
- [ ] Full typecheck/tests/build PASS
- [ ] API HTTPS, DB/Redis TLS आणि backups enabled
- [ ] Razorpay live webhook verified
- [ ] Privacy/terms/refund/cancellation/account deletion URLs live
- [ ] Data safety form actual data flow शी जुळतो
- [ ] Reviewer login/access instructions valid
- [ ] Real-device E2E pass
- [ ] Internal/closed testing complete
- [ ] Crash/ANR/monitoring alerts active
- [ ] Rollback owner आणि incident contacts निश्चित

## Official references

- Google Play target API policy: https://support.google.com/googleplay/android-developer/answer/11926878
- New personal-account testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Expo Android submission: https://docs.expo.dev/submit/android/
