# Performance checks

Run `k6 run tests/performance/booking-smoke.k6.js` against a disposable environment. Targets: p95 below 500 ms and error rate below 1%. Use separate booking/auth scenarios with seeded test users before release; never load-test production without approval.
