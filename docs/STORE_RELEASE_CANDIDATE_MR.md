# HOUSE HELP — Store Release Candidate

या आवृत्तीत static fixes:
- Customer/Provider Expo config typing आणि OTA URL दुरुस्त.
- Mobile dependency versions consistent pin केल्या.
- Node 22 LTS standard केले.
- Account deletion API, in-app action आणि public deletion-information page जोडली.
- Blank Firebase email local test failure दुरुस्त.
- Production example MSG91/FCM साठी fail-safe केला.
- Local release verification कडक केली.
- `npm run store:gate` static Store gate जोडला.

## अजून machine/owner शिवाय पूर्ण न होणारे blockers
- Internet-enabled machine वर `npm install` करून `package-lock.json` commit करा.
- Current Store-supported Expo SDK वर upgrade करून Expo Doctor/build PASS करा.
- `prisma migrate dev --name init` ने migration तयार आणि commit करा.
- Real Razorpay, MSG91, Firebase आणि HTTPS staging E2E test करा.
- Signed Android AAB व iOS IPA तयार करून Internal Testing/TestFlight करा.
- 20–50 users pilot आणि P0/P1 bugs zero sign-off.

कोणत्याही app ला 100% bug-free हमी देता येत नाही. `npm run store:gate`, CI, signed builds, real-device QA आणि pilot सर्व PASS झाल्यावरच Production rollout करा.
