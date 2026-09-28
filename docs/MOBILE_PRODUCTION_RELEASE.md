# iOS and Android production release

Both HOUSE HELP apps are configured for Android App Bundles and iOS App Store archives through Expo EAS. Production builds require HTTPS, remote signing credentials, restricted foreground-only location, secure token storage, notification permission text, Android code/resource shrinking, iOS privacy-manifest aggregation, runtime-versioned OTA updates and separate bundle IDs.

## Secure variables
Set these in the Expo project or GitHub `mobile-production` environment, never in source control:
- `EXPO_TOKEN`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_CUSTOMER_EAS_PROJECT_ID`
- `EXPO_PUBLIC_PROVIDER_EAS_PROJECT_ID`
- Apple App Store Connect and Google Play service-account credentials through EAS Credentials.

## Build
From each app directory: `npm run release:check`, then `npm run build:all`. Upload Android to Internal testing and iOS to TestFlight before review. Actual signed AAB/IPA generation requires the project owner's Expo, Apple and Google credentials.
