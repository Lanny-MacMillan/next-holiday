# Architecture

## The pieces

```mermaid
flowchart LR
  Browser["Browser<br/>React 19, Redux Toolkit, RTK Query"]
  Auth0["Auth0<br/>login, ID tokens"]
  App["Next.js app on AWS Amplify<br/>pages + /api routes"]
  DB[("MySQL<br/>via Prisma")]
  SSE["SSE service on EC2<br/>separate repo, PM2"]

  Browser -- "log in" --> Auth0
  Browser -- "API calls with the ID token" --> App
  App -- "verifies the token against Auth0's keys" --> Auth0
  App --> DB
  App -- "POST /api/notify (shared secret)" --> SSE
  Browser -. "live stream (short-lived ticket)" .-> SSE
```

The notification service is its own project because Amplify's serverless runtime cannot hold long-lived connections open. See [sse-notifications](https://github.com/Lanny-MacMillan/sse-notifications).

## How a request is authenticated

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as Auth0
  participant M as Middleware
  participant R as API route
  participant D as MySQL

  B->>A: Log in
  A-->>B: ID token
  B->>M: GET /api/home + Bearer ID token
  M->>A: Fetch signing keys (cached)
  M->>M: Check signature, issuer, audience, expiry
  M->>R: Allowed
  R->>R: Act as the verified user, never an id from the request
  R->>D: Query scoped to that user's accounts and shares
  D-->>R: Rows
  R-->>B: JSON
```

- The client attaches the token in one place (`src/lib/authFetch.ts`), so components never handle it.
- `src/middleware.ts` rejects any `/api/*` request without a valid token, except the health check and the anonymous performance beacon, and rate limits per client.
- Routes read the user from the verified token (`authenticate()` in `src/lib/routeAuth.ts`). A user id sent in a body, query string or header is not trusted.
- Every route that touches a record checks the caller owns it or belongs to it (`assertHolidayAccess`, `src/lib/rbac.ts`) and looks the record up within that parent, not by its id alone.

## How a live notification gets to a browser

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as Next.js app
  participant S as SSE service

  B->>A: POST /api/sse-ticket (with the ID token)
  A-->>B: 60 second ticket, signed with the shared secret
  B->>S: Open the event stream with the ticket
  S->>S: Verify the ticket
  Note over A,S: Later, someone shares a holiday
  A->>S: POST /api/notify (bearer shared secret)
  S-->>B: Event over the open stream
```

The stream URL never carries a user id: the ticket is the proof of who is listening, and it expires within a minute.

## How the data is loaded

`/api/home` returns everything a signed-in user needs in one request. A shared `loadHome` thunk (`src/store/loadHome.ts`) puts it in the `home` slice and pre-fills the RTK Query caches, so holiday pages render without further requests. It runs for any page, so a holiday page can be opened directly.

## How changes are checked

```mermaid
flowchart LR
  PR["Pull request"] --> L["lint, formatting, dead code"]
  PR --> T["typecheck, including tests"]
  PR --> U["unit tests + 70% coverage of changed lines"]
  PR --> B["production build"]
  PR --> E["browser tests against a real Auth0 test tenant"]
  PR --> C["CodeQL"]
```

The browser tests sign in with a real token from an isolated Auth0 test connection, then add a gift, check one user cannot reach another's holiday, share a holiday and accept the invite, and open a holiday page directly.
