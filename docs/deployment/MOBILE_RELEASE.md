# Mobile release

1. Create separate Expo projects for customer and provider apps.
2. Restrict Google Maps keys by Android package/SHA-1 and iOS bundle ID.
3. Configure Apple Sign In, Google OAuth, FCM/APNs and privacy manifests.
4. Run `eas build --profile production --platform all` in each app.
5. Test release candidates through Internal Testing and TestFlight.
6. Capture screenshots on real target dimensions, complete data-safety/privacy forms, and submit with the documents in `docs/legal` and `docs/store`.

Location wording must state that tracking is limited to active assigned bookings. Background location is intentionally not requested.
