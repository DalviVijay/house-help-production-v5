# Local Developer Build Verification

## आवश्यक software
- Node.js 20 LTS आणि npm 10+
- Docker Desktop
- Git
- Android Studio; iOS साठी macOS + Xcode

## एक command
Project root मध्ये:

```bash
./scripts/local-build-verify.sh
```

हा command dependency lockfile तयार करतो, PostgreSQL/Redis सुरू करतो, Prisma migration/seed, backend tests/build, Admin build, दोन्ही mobile typechecks, Expo Doctor आणि Android JavaScript bundle export चालवतो.

`LOCAL BUILD VERIFICATION PASS` दिसल्याशिवाय staging किंवा store testing सुरू करू नका. वास्तविक Razorpay, MSG91 आणि Firebase चाचणीसाठी त्यांच्या sandbox/test credentials सुरक्षित environment variables मध्ये सेट कराव्या लागतील; chat किंवा source code मध्ये टाकू नयेत.
