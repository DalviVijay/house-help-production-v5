# Observability

Scrape authenticated `/metrics`; centralize JSON logs; alert on API 5xx >2%, p95 >750 ms, readiness failures, payment verification failures, webhook lag, outbox dead rows, provider-location rejection spikes, DB storage/connections and Redis memory. Set `APP_VERSION` and `GIT_SHA` on every release. Do not put customer addresses, tokens, documents or payment payloads in logs.
