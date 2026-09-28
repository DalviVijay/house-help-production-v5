# Production-testable MVP — अंमलबजावणी अहवाल

## या आवृत्तीत पूर्ण केलेले
- Customer OTP login, token refresh, service/address/booking API flow आणि Razorpay checkout + backend verification.
- Provider OTP login with provider-role validation, assigned jobs, accept/reject, controlled status transitions आणि foreground live-location updates.
- Offline banner, loading/error/retry handling आणि secure token storage.
- Admin login page आणि विद्यमान authenticated analytics dashboard.
- MSG91 production OTP sender; production मध्ये console OTP बंद.
- MVP API validation tests आणि dependency declarations.

## अजून credentials शिवाय पूर्ण होऊ शकत नाही
EAS signed AAB/IPA, Google Play/Internal track, TestFlight, real MSG91/Razorpay/FCM, public policy URLs आणि real-device QA. Production rollout पूर्वी staging database, migration, backup restore drill, payment webhook test आणि 20–50 users pilot आवश्यक आहे.

## QA नियम
`npm install`, Prisma generate/migrate, backend test/typecheck, Expo prebuild, Android/iOS signed builds आणि real-device critical-flow test यापैकी एकही fail असल्यास Production publish करू नये.
