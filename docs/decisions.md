# Design decisions

Short notes on choices that are not obvious from the code, with the reason.

**The server verifies Auth0 ID tokens itself.** Early on, routes trusted a user id sent by the client, which anyone could forge. Every `/api` request now carries the ID token and `src/middleware.ts` verifies it with `jose` against Auth0's published keys. Routes act as the verified user.

**Live notifications run as a separate service.** Amplify's serverless runtime cannot keep a connection open for server-sent events, so a small Node service on EC2 holds the streams. The app tells it what to send; the browser connects with a 60 second signed ticket instead of a user id in the URL.

**Records are looked up inside the authorised parent.** Checking that a caller may open a holiday is not enough if the next query fetches a card or guest by its own id. Cards, guests, gifts and tasks are always queried with the holiday id as well, so a valid holiday cannot be used to reach another holiday's records.

**One request loads the home data; holiday pages read it.** `/api/home` fills the `home` slice and the RTK Query caches, which keeps navigation instant. The cost was that only the home route loaded it, so opening a holiday page directly hung. A shared loader now runs on every page, and a browser test covers it.

**Holiday pages share a template.** Per-holiday slices and per-holiday copies of a page drifted apart and carried most of the dead code. New holiday behaviour goes into `HolidayPageTemplate` and the shared hooks. Some older pages still predate that rule and are being folded in.

**Tests do not drive the code.** The suite asserts current behaviour. When a test finds a real bug it is recorded as a known issue (`it.failing`) and fixed in a separate change, so the diff shows both the bug and the fix.

**Browser tests use a real Auth0 tenant, isolated.** Mocked tokens would skip the part most likely to break. The tests use a dedicated Auth0 application and database connection that only they can use, and request tokens directly so they do not depend on the login page. There is no test-only path in the app.

**Sentry source maps are uploaded only when a token is set.** With `SENTRY_AUTH_TOKEN` in the build environment (Amplify, as a secret), the build uploads source maps to Sentry so production stack traces show the real file and line, then deletes them from the build so they are never served. Without the token the build is untouched. A failed upload only warns and never stops a deploy. The organisation and project default to `next-holiday` and `javascript-nextjs` and can be overridden with `SENTRY_ORG` and `SENTRY_PROJECT`.

**Rate limiting is per server instance.** It is held in memory, so with several instances the real ceiling is higher. It guards against abuse; it is not a billing quota.

**The Content Security Policy starts in report-only mode.** The policy is built from the same environment variables the app uses, and a browser test fails if a normal visit breaks it. It is enforced only after production has been browsed with the console open.
