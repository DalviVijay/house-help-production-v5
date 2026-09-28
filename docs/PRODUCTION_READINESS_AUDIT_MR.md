# HOUSE HELP — Production Readiness Audit (मराठी)

Audit date: 21 सप्टेंबर 2026

## निष्कर्ष

**स्थिती: Play Store Production साठी अद्याप तयार नाही.** Repository-level structural checks pass होतात; पण mobile apps च्या entry points मध्ये पूर्ण real API/auth/navigation जोडलेली नाही. त्यामुळे फक्त AAB build यशस्वी झाला तरी app usable production marketplace होत नाही.

## P0 — Publish करण्यापूर्वी अनिवार्य

1. **Customer app integration:** `App.tsx` सध्या फक्त `BookingFlow` दाखवतो. Login/OTP, services, address, pricing, booking creation, Razorpay checkout, notifications, tracking आणि account deletion वास्तविक backend शी जोडणे आवश्यक.
2. **Provider app integration:** `App.tsx` सध्या static `ProviderDashboard` दाखवतो. Authentication, KYC/status, jobs fetch, accept/reject, state transitions, earnings आणि foreground tracking API शी जोडणे आवश्यक.
3. **Navigation/state/error handling:** authenticated/unauthenticated navigation, loading, empty, retry, offline, expired-session आणि server-error UX आवश्यक.
4. **Payment E2E:** mobile Razorpay SDK integration, backend order creation, signature verification, webhook reconciliation, duplicate handling आणि refund path real test करणे आवश्यक.
5. **OTP delivery:** production SMS provider प्रत्यक्ष जोडून abuse/rate-limit आणि delivery failure तपासा.
6. **Account deletion:** app आणि public web deletion path implement करा; backend personal-data deletion/retention process स्पष्ट करा.
7. **Real tests:** mobile unit/component/E2E tests सध्या दिसत नाहीत. Critical customer/provider flows साठी automated tests जोडा.
8. **Dependency lock:** root `package-lock.json` repository मध्ये नाही. Supported Node/npm वर install करून lockfile commit करा आणि CI मध्ये `npm ci` वापरा.
9. **Expo upgrade validation:** Expo SDK 52 जुना आहे. API 36 compatible supported Expo SDK वर upgrade करून EAS production build, prebuild आणि real-device regression पूर्ण करा.
10. **Store/legal URLs:** policy files repository मध्ये आहेत; public HTTPS URLs, actual business/legal details आणि current data practices शी त्यांची पडताळणी करा.

## P1 — Launch quality

- Accessibility labels, dynamic font, screen-reader आणि Marathi glyph/device testing.
- Analytics consent/data minimization आणि crash reporting.
- Image upload/KYC hardening: file type, size, malware scan, private bucket, signed URLs.
- Backup restore drill आणि payment/booking incident runbook rehearsal.
- Load test with realistic concurrency; DB indexes/slow queries verify करा.
- Admin audit trail व least-privilege review.
- Staging environment production पासून पूर्ण वेगळे ठेवा.

## या pass मध्ये केलेले hardening

- Google Play च्या 31 ऑगस्ट 2026 API requirement नुसार Android target/compile API 36 release checks.
- `FCM_ENABLED=false` चुकीने truthy होऊ नये म्हणून strict boolean parsing.
- Production मध्ये core payment, encryption आणि metrics secrets साठी fail-fast validation.
- FCM enabled असल्यास Firebase project/client email/private key अनिवार्य validation.
- Marathi Play Store/deployment guide.
- एकत्रित `npm run release:check` command.

## उपलब्ध checks व त्यांचा अर्थ

- `node scripts/verify.mjs` — release files/config safeguards तपासतो; functional E2E test नाही.
- `verify-mobile-release.mjs` — identifiers, permissions, AAB config, target API तपासतो; app flows तपासत नाही.
- Backend unit/integration tests — dependencies, test DB/config सह स्वतंत्रपणे चालवणे आवश्यक.

**Release निर्णय:** वरील P0 items पूर्ण आणि evidence सहित QA sign-off होईपर्यंत internal/closed track पुरतेच मर्यादित ठेवा; Production rollout करू नका.
