# Next Holiday

Next.js 15 (App Router) + React 19, Redux Toolkit / RTK Query, Prisma + MySQL, Auth0. Deployed on AWS Amplify. A separate SSE service (own repo, on EC2) handles live notifications.

## Commands

- `npm run dev` / `npm run build`
- `npm test`, `npm run test:ci` (coverage, as CI runs it)
- `npm run lint -- --quiet` (errors only), `npm run typecheck`, `npm run format:check`, `npm run knip` (unused files, exports, types and dependencies)

CI runs four parallel jobs on every PR: `lint` (also checks formatting and dead code), `typecheck`, `test` and `build`.

## Data flow

- Server data comes from the API through RTK Query (`src/store/api.ts`) or a store thunk. Do not load data with `fetch` inside `useEffect` (a lint error; four older cases are warnings in `eslint.config.mjs`). A `fetch` in a button or form handler is fine.
- `/api/home` (`src/lib/server/homeData.ts`) hydrates the `home` slice; holiday pages read from it. Mutations update `home` on success.
- Holiday landing pages are built from `HolidayPageTemplate`; the pages under a holiday are short wrappers around `GiftListPage`, `CardsPage`, `GuestListPage` or `TasksPage` (in `src/components/templates`), each with a config in `src/config/*Configs.ts`. Do not add per-holiday slices or per-holiday copies of a page; add a config entry, or extend the shared component. See `docs/page-unification.md`.
- `localStorage` is only for UI preferences (theme, display mode) and the redux-persist whitelist in `src/store/index.ts`. Never for server data.

## Auth and API routes

- The client sends the Auth0 ID token as a Bearer token (`src/lib/authFetch.ts`). The server verifies it (`src/lib/auth.ts`); `src/middleware.ts` rejects unauthenticated `/api/*` requests.
- A user id from a request body, query string or header is never trusted. Use `authenticate()` from `src/lib/routeAuth.ts` and act as the verified user.
- Every route that touches a resource must check the caller owns it or belongs to it (`assertHolidayAccess`, `isShareParticipant`, `src/lib/rbac.ts`). Look records up scoped to the authorised parent, not by id alone.
- New API routes need tests covering the unauthenticated and wrong-user cases.
- Files named `route.ts` may only export HTTP handlers (and Next route config). Exporting anything else breaks `next build`, which `typecheck` does not catch; keep shared constants in `src/lib`.

## Tests

- Jest + Testing Library. Tests are transpile-only; types are checked by `npm run typecheck`.
- `src/__tests__/smoke/pages.smoke.test.tsx` renders every page under `src/app`. Keep it passing when moving or deleting code.
- Write tests against current behaviour. Do not change application code just to satisfy a test.
- CI requires at least 70% coverage of the lines a PR changes (`diff-cover`), plus a global coverage floor in `jest.config.js`. New or changed code needs tests; run `npm run test:ci` to check locally.

## Style

- Keep comments sparse. Add one only where the reason is not obvious from the code.
- Run `npx prettier --write` on files you change.
